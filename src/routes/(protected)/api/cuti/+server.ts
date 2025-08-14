import { error, json } from "@sveltejs/kit";
import { formatTanggal, formatTanggalISO, prismaErrorHandler, } from "@lib/utils";
import { prisma } from '@lib/utils.js'
import { eachDayOfInterval, format, getDay, getYear } from "date-fns";
import { v4 as uuid4 } from "uuid";
import path from 'path'
import { extname } from "node:path";
import { writeFile } from 'fs/promises'

export async function GET({ url }) {
    const page = Number(url.searchParams.get('_page')) || 1
    const limit = Number(url.searchParams.get('_limit')) || 10
    const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') || "date"
    const order = url.searchParams.get('_order') || "asc"
    const search = url.searchParams.get('_search') || ""

    const payroll = url.searchParams.get('payroll')
    const start_date = url.searchParams.get('start_date') || ""
    const end_date = url.searchParams.get('end_date') || ""

    const status = await prisma.$transaction(async (tx) => {
        const items = await tx.$queryRawUnsafe(`
            SELECT c.*, e.name, approve.name as approval_name FROM cuti as c
            LEFT JOIN employee as e ON c.payroll = e.payroll
            LEFT JOIN employee as approve ON c.approval = approve.payroll
            WHERE e.payroll = ? AND (cuti_id like ?) AND DATE(c.date) BETWEEN ? AND ?
            ORDER by ${sort} ${order} LIMIT ? OFFSET ?`,
            payroll, `%${search}%`, start_date, end_date, limit, offset)

        const [{ count }] = await tx.$queryRawUnsafe(`SELECT count(*) as count FROM cuti as c
            LEFT JOIN employee as e ON c.payroll = e.payroll
            LEFT JOIN employee as approve ON c.approval = approve.payroll
            WHERE e.payroll = ? AND (cuti_id like ?) AND DATE(c.date) BETWEEN ? AND ?`,
            payroll, `%${search}%`, start_date, end_date) as { count: number }[]
        return { items, totalItems: Number(count) }
    })
    return json(status)
}

export async function POST({ request }) {
    try {
        const data = await request.formData();
        const attachment = data.get('attachment')
        const isAttachment = typeof attachment == "object" ? true : false

        const status = await prisma.$transaction(async tx => {
            const getCuti = await tx.cuti.findUnique({
                where: { cuti_id: data.get('cuti_id') }
            })

            const user = await tx.employee.findUnique({
                select: {
                    workhour: true,
                    user_type: true
                },
                where: { payroll: data.get('payroll') as string, status: "Aktif" }
            })
            if (!user) throw new Error(`Karyawan tidak ditemukan atau status nonaktif`)

            if (!getCuti) {
                const cuti_group_id = uuid4()
                const year = getYear(new Date())
                const month = 12
                const tanggal = data.get('date')?.split(',')

                const resCalendar = await tx.$queryRawUnsafe(`SELECT date FROM calendar WHERE YEAR(date) = ? AND month(date) <= ?
                    ORDER BY date asc`, year, month) as { date: string }[]

                const resCuti = await tx.$queryRawUnsafe(`SELECT date FROM cuti WHERE (DATE(date) BETWEEN ? AND ?) AND payroll = ? AND status IN ('Waiting','Approved')`,
                    tanggal[0], tanggal[1], data.get('payroll')) as { date: string }[]

                const daysInRange = eachDayOfInterval({ start: tanggal[0], end: tanggal[1] })
                const dayFree = user?.workhour == 7 ? [0] : [0, 6]

                const temp = daysInRange.filter(v => {
                    return !resCalendar.some(cal => formatTanggal(format(v, "yyyy-MM-dd"), "date") == formatTanggal(format(cal.date, "yyyy-MM-dd"), "date"))
                        && !resCuti.some(cal => formatTanggal(format(v, "yyyy-MM-dd"), "date") == formatTanggal(format(cal.date, "yyyy-MM-dd"), "date"))
                        && !dayFree.includes(getDay(v))
                }).map(v => formatTanggal(format(v, "yyyy-MM-dd"), "date"))

                const cutiDuplikat = daysInRange.filter(v => {
                    return resCuti.some(cal => formatTanggal(format(v, "yyyy-MM-dd"), "date") == formatTanggal(format(cal.date, "yyyy-MM-dd"), "date"))
                }).map(v => format(v, "yyyy-MM-dd"))

                if (cutiDuplikat.length > 0) throw new Error(`Cuti tidak dapat disimpan, pengajuan sudah ada sebelumnya ${JSON.stringify(cutiDuplikat)}`)
                if (temp.length == 0) throw new Error(`Cuti tidak dapat disimpan, cuti tidak dapat dimasukkan pada hari weekend`)

                const fileAttachment = isAttachment ? cuti_group_id + extname(attachment?.name || "") : ""

                const insertCuti = await tx.cuti.createMany({
                    data: [...temp.map((date) => ({
                        cuti_id: uuid4(),
                        cuti_group_id,
                        payroll: data.get('payroll'),
                        type: data.get('type'),
                        description: data.get('description'),
                        date: formatTanggalISO(date),
                        year: getYear(tanggal[0]),
                        status: user.user_type != 'HR' && data.get('user_hrd') ? "Approved" : "Waiting",
                        approval: data.get('approval'),
                        is_delegate: false,
                        attachment: fileAttachment,
                        createdAt: formatTanggalISO(new Date())
                    }))]
                })

                if (insertCuti && attachment) {
                    const filename = path.resolve(process.env.ATTACH_CUTI as string) + `/${fileAttachment}`
                    await writeFile(filename, Buffer.from(await attachment?.arrayBuffer()));
                }

                return { message: "Cuti berhasil disimpan" }
            } else {
                const updateCuti = await tx.$executeRawUnsafe(`
                    UPDATE cuti SET date=?,description=?,type=? WHERE cuti_id=?`,
                    data.get('date'), data.get('description'), data.get('type'), data.get('cuti_id'))

                if (!updateCuti) throw new Error("Cuti tidak dapat disimpan, data ada yang berubah")

                return { message: "Cuti berhasil diubah" }
            }
        })

        return json(status);
    } catch (err: any) {
        error(500, prismaErrorHandler(err))
    }
}