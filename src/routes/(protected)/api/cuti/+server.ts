import { error, json } from "@sveltejs/kit";
import { formatTanggal, formatTanggalISO, prismaErrorHandler, } from "@lib/utils";
import { prisma } from '@lib/utils.js'
import { eachDayOfInterval, format, getDay, getYear } from "date-fns";
import { v4 as uuid4 } from "uuid";

export async function GET({ url }) {
    const page = Number(url.searchParams.get('_page')) || 1
    const limit = Number(url.searchParams.get('_limit')) || 10
    const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') || "date"
    const order = url.searchParams.get('_order') || "asc"
    const search = url.searchParams.get('_search') || ""

    const payroll = url.searchParams.get('payroll')

    const status = await prisma.$transaction(async (tx) => {
        const items = await tx.$queryRawUnsafe(`
            SELECT c.*, e.name, approve.name as approval_name FROM cuti as c
            LEFT JOIN employee as e ON c.payroll = e.payroll
            LEFT JOIN employee as approve ON c.approval = approve.payroll
            WHERE e.payroll = ? AND (cuti_id like ?)
            ORDER by ${sort} ${order} LIMIT ? OFFSET ?`,
            payroll, `%${search}%`, limit, offset)

        const [{ count }] = await tx.$queryRawUnsafe(`SELECT count(*) as count FROM cuti as c
            LEFT JOIN employee as e ON c.payroll = e.payroll
            LEFT JOIN employee as approve ON c.approval = approve.payroll
            WHERE e.payroll = ? AND (cuti_id like ?)`,
            payroll, `%${search}%`) as { count: number }[]
        return { items, totalItems: Number(count) }
    })
    return json(status)
}

export async function POST({ request }) {
    try {
        const data = await request.json();

        const status = await prisma.$transaction(async tx => {
            const getCuti = await tx.cuti.findUnique({
                where: { cuti_id: data.cuti_id }
            })

            if (!getCuti) {
                const user = await tx.employee.findUnique({
                    select: { workhour: true },
                    where: { payroll: data.payroll }
                })

                const year = getYear(new Date())
                const month = 12
                const resCalendar = await tx.$queryRawUnsafe(`SELECT date FROM calendar WHERE YEAR(date) = ? AND month(date) <= ?
                    ORDER BY date asc`, year, month) as { date: string }[]

                const resCuti = await tx.$queryRawUnsafe(`SELECT date FROM cuti WHERE (DATE(date) BETWEEN ? AND ?) AND payroll = ? AND status IN ('Waiting','Approved')`,
                    data.date[0], data.date[1], data.payroll) as { date: string }[]

                const daysInRange = eachDayOfInterval({ start: data.date[0], end: data.date[1] })
                const dayFree = user?.workhour == 7 ? [0] : [0, 6]

                const temp = daysInRange.filter(v => {
                    return !resCalendar.some(cal => formatTanggal(format(v, "yyyy-MM-dd"), "date") == formatTanggal(format(cal.date, "yyyy-MM-dd"), "date"))
                        && !resCuti.some(cal => formatTanggal(format(v, "yyyy-MM-dd"), "date") == formatTanggal(format(cal.date, "yyyy-MM-dd"), "date"))
                        && !dayFree.includes(getDay(v))
                }).map(v => formatTanggal(format(v, "yyyy-MM-dd"), "date"))

                const cuti_group_id = uuid4()

                const cutiDuplikat = daysInRange.filter(v => {
                    return resCuti.some(cal => formatTanggal(format(v, "yyyy-MM-dd"), "date") == formatTanggal(format(cal.date, "yyyy-MM-dd"), "date"))
                }).map(v => format(v, "yyyy-MM-dd"))

                if (cutiDuplikat.length > 0) {
                    throw new Error(`Cant insert cuti, because there is cuti already inserted ${JSON.stringify(cutiDuplikat)}`)
                }

                await tx.cuti.createMany({
                    data: [...temp.map((date) => ({
                        cuti_id: uuid4(),
                        cuti_group_id,
                        payroll: data.payroll,
                        type: data.type,
                        description: data.description,
                        date: formatTanggalISO(date),
                        year: getYear(data.date[0]),
                        status: data.status,
                        approval: data.approval,
                        is_delegate: false,
                        createdAt: formatTanggalISO(new Date())
                    }))]
                })

                return { message: "Cuti successfully saved" }
            } else {
                const updateCuti = await tx.$executeRawUnsafe(`
                    UPDATE cuti SET date=?,description=?,type=? WHERE cuti_id=?`,
                    data.date, data.description, data.type, data.cuti_id)

                if (!updateCuti) throw new Error("Cant update SPL, because data is changed")

                return { message: "Cuti successfully updated" }
            }
        })

        return json(status);
    } catch (err: any) {
        error(500, prismaErrorHandler(err))
    }
}