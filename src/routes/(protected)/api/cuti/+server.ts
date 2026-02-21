import { error, json, type RequestHandler } from "@sveltejs/kit";
import { formatTanggal, formatTanggalISO, prismaErrorHandler, } from "@lib/utils";
import { prisma } from '@lib/utils.js'
import { eachDayOfInterval, format, getDay, getYear } from "date-fns";
import { v4 as uuid4 } from "uuid";
import path from 'path'
import { extname } from "node:path";
import { writeFile } from 'fs/promises'

export const GET: RequestHandler = async ({ url }) => {
    const page = Number(url.searchParams.get('_page')) || 1
    const limit = Number(url.searchParams.get('_limit')) || 10
    const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') || "date"
    const order = url.searchParams.get('_order') || "desc"
    const search = url.searchParams.get('_search') || ""

    const payroll = url.searchParams.get('payroll')
    const start_date = url.searchParams.get('start_date') || ""
    const end_date = url.searchParams.get('end_date') || ""

    const status = await prisma.$transaction(async (tx) => {
        const items = await tx.$queryRawUnsafe(`
            SELECT c.*, e.name, approve.name as approval_name FROM cuti as c
            LEFT JOIN employee as e ON c.payroll = e.payroll
            LEFT JOIN employee as approve ON c.approval = approve.payroll
            WHERE e.payroll = ? AND (cuti_id like ? OR c.date = ?) AND DATE(c.date) BETWEEN ? AND ?
            ORDER by ${sort} ${order} LIMIT ? OFFSET ?`,
            payroll, `%${search}%`, search, start_date, end_date, limit, offset)
        const [{ count }] = await tx.$queryRawUnsafe(`SELECT count(*) as count FROM cuti as c
            LEFT JOIN employee as e ON c.payroll = e.payroll
            LEFT JOIN employee as approve ON c.approval = approve.payroll
            WHERE e.payroll = ? AND (cuti_id like ? OR c.date = ?) AND DATE(c.date) BETWEEN ? AND ?`,
            payroll, `%${search}%`, search, start_date, end_date) as { count: number }[]
        return { items, totalItems: Number(count) }
    })
    return json(status)
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        const data = await request.formData();
        const attachment = data.get('attachment')
        const isAttachment = typeof attachment == "object" ? true : false

        const status = await prisma.$transaction(async tx => {
            const getCuti = await tx.cuti.findUnique({
                where: { cuti_id: data.get('cuti_id') }
            })
            const year = getYear(new Date())
            const month = 12

            const [user] = await tx.$queryRawUnsafe(`
                SELECT workhour, user_type, cuti_kunci, HakCuti - CutiTahunan - CutiBersama as sisa_cuti FROM 
                    (SELECT e.workhour, e.cuti_kunci, e.user_type, getHakCuti(e.join_date, CONCAT(?, DATE_FORMAT(CURDATE(), '-%m-%d'))) AS HakCuti,
                    SUM(CASE WHEN c.status IN ('Waiting','Approved') THEN 1 ELSE 0 END) as CutiTahunan, a.CutiBersama
                    FROM employee e
                    LEFT JOIN (
                        SELECT user_id_machine, SUM(CASE WHEN type = 'Cuti Bersama' THEN 1 ELSE 0 END) AS CutiBersama
                        FROM attendance
                        WHERE YEAR(check_in) = ?
                        GROUP BY user_id_machine
                    ) a ON a.user_id_machine = e.user_id_machine
                    LEFT JOIN cuti c ON c.payroll = e.payroll AND YEAR(c.date) = ?
                    WHERE e.payroll = ? AND e.status = 'Aktif'
                    GROUP BY e.payroll
                ) temp`,
                year, year, year, data.get('payroll')) as { workhour: number, cuti_kunci: number, user_type: string, sisa_cuti: number }[]

            if (!user) throw new Error(`Karyawan tidak ditemukan atau status nonaktif`)

            if (!getCuti) {
                const cuti_group_id = uuid4()
                const tanggal = data.get('date')?.split(',')

                const resCalendar = await tx.$queryRawUnsafe(`SELECT date FROM calendar WHERE YEAR(date) = ? AND month(date) <= ?
                    ORDER BY date asc`, year, month) as { date: string }[]

                // const resCalendarTemp = await tx.$queryRawUnsafe(`SELECT DATE(a.check_in) as date 
                //     FROM attendance as a 
                //     LEFT JOIN employee as e ON a.user_id_machine = e.user_id_machine 
                //     WHERE YEAR(a.check_in) = ? AND month(a.check_in) <= ? AND e.payroll = ? AND a.type IN ('Hari Libur','Event Kantor','Cuti bersama')
                //     ORDER BY date asc`, year, month, data.get('payroll')) as { date: string }[] //! Perlu di recheck

                const resCuti = await tx.$queryRawUnsafe(`SELECT date FROM cuti WHERE (DATE(date) BETWEEN ? AND ?) AND payroll = ? AND status IN ('Waiting','Approved')`,
                    tanggal[0], tanggal[1], data.get('payroll')) as { date: string }[]

                const daysInRange = eachDayOfInterval({ start: tanggal[0], end: tanggal[1] })
                const dayFree = user.workhour == 7 ? [0] : [0, 6]

                const cutiDuplikat = daysInRange.filter(v =>
                    resCuti.some(cal => formatTanggal(format(v, "yyyy-MM-dd"), "date") == formatTanggal(format(cal.date, "yyyy-MM-dd"), "date"))
                ).map(v => format(v, "yyyy-MM-dd"))

                const cutiValid = daysInRange.filter(v => {
                    return !resCalendar.some(cal => formatTanggal(format(v, "yyyy-MM-dd"), "date") == formatTanggal(format(cal.date, "yyyy-MM-dd"), "date"))
                        && !resCuti.some(cal => formatTanggal(format(v, "yyyy-MM-dd"), "date") == formatTanggal(format(cal.date, "yyyy-MM-dd"), "date"))
                        && !dayFree.includes(getDay(v))
                }).map(v => formatTanggal(format(v, "yyyy-MM-dd"), "date"))

                if (cutiDuplikat.length > 0) throw new Error(`Cuti tidak dapat disimpan, pengajuan sudah ada sebelumnya ${JSON.stringify(cutiDuplikat)}`)
                if (cutiValid.length == 0) throw new Error(`Cuti tidak dapat disimpan, cuti tidak dapat dimasukkan pada hari weekend`)
                if (data.get('type') == "Cuti Tahunan" && user.cuti_kunci && cutiValid.length > user.sisa_cuti) throw new Error(`Anda mengajukan Cuti Tahunan ${cutiValid.length} hari dari sisa cuti ${user.sisa_cuti} hari (Periksa apakah ada cuti yang masih "Waiting")`)

                const fileAttachment = isAttachment ? cuti_group_id + extname(attachment?.name || "") : ""

                const insertCuti = await tx.cuti.createMany({
                    data: [...cutiValid.map((date) => ({
                        cuti_id: uuid4(),
                        cuti_group_id,
                        payroll: data.get('payroll'),
                        type: data.get('type'),
                        description: data.get('description'),
                        date: formatTanggalISO(date),
                        year: getYear(tanggal[0]),
                        status: user.user_type != 'HR' && data.get('user_hrd') == "true" ? "Approved" : "Waiting",
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