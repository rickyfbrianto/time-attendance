import { error, json } from "@sveltejs/kit";
import { formatTanggal, prisma, prismaErrorHandler } from '@lib/utils.js'
import { eachDayOfInterval, format } from "date-fns";

export async function GET({ url }) {
    const page = Number(url.searchParams.get('_page')) || 1
    const limit = Number(url.searchParams.get('_limit')) || 10
    const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') ?? "skpd_id"
    const order = url.searchParams.get('_order') ?? "asc"
    const search = url.searchParams.get('_search') ?? ""

    const payroll = url.searchParams.get('payroll') || ""

    const status = await prisma.$transaction(async (tx) => {
        const items = await tx.$queryRawUnsafe(`
            SELECT skpd_id, s.sppd_id, sppd.location, sd.description, e.name, e.payroll, real_start, real_end, s.status FROM SKPD as s
            LEFT JOIN employee as e ON e.payroll = s.payroll
            LEFT JOIN sppd ON sppd.sppd_id = s.sppd_id
            LEFT JOIN sppd_detail as sd ON s.payroll = sd.payroll AND s.sppd_id = sd.sppd_id
            WHERE sd.payroll like ? && (skpd_id like ? OR s.sppd_id like ? OR e.name like ? OR real_start like ? OR real_end like ?)
            ORDER by ${sort} ${order} LIMIT ? OFFSET ?`,
            `%${payroll}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, limit, offset)

        const [{ count }] = await tx.$queryRawUnsafe(`SELECT count(*) as count FROM SKPD as s
            LEFT JOIN employee as e ON e.payroll = s.payroll
            LEFT JOIN sppd ON sppd.sppd_id = s.sppd_id
            LEFT JOIN sppd_detail as sd ON s.payroll = sd.payroll AND s.sppd_id = sd.sppd_id
            WHERE sd.payroll like ? && (skpd_id like ? OR s.sppd_id like ? OR e.name like ? OR real_start like ? OR real_end like ?)`,
            `%${payroll}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`) as { count: number }[]

        return { items, totalItems: Number(count) }
    })

    return json(status)
}

export async function POST({ request, }) {
    try {
        const data = await request.json();

        const status = await prisma.$transaction(async tx => {
            // const getSKPD = await tx.skpd.findUnique({
            //     where: { skpd_id: data.skpd_id }
            // })

            if (data.addMode) {
                const querySKPD = data.skpd_detail.map((v: any) => {
                    const skpd_id = v.skpd_id.replace(/\//g, '_')
                    return tx.$executeRawUnsafe(`
                        INSERT INTO SKPD (skpd_id, sppd_id, payroll, real_start, real_end, status, approve, createdBy, createdAt) 
                        VALUES(?, ?, ?, ?, ?, ?, ?, ?, now())`,
                        skpd_id, data.sppd_id, v.payroll, data.date[0], data.date[1], data.status, data.approve, data.createdBy)
                })

                const queryAttendance = data.skpd_detail.flatMap((v: any) => {
                    return eachDayOfInterval({ start: data.date[0], end: data.date[1] }).map(date => {
                        return tx.$executeRawUnsafe(`
                            INSERT INTO attendance(attendance_id,user_id_machine,check_in,check_out,type,description,reference) 
                            VALUES(UUID(), ?, ?, ?, ?, ?, ?)`,
                            v.user_id_machine, formatTanggal(format(date, "yyyy-MM-dd"), "date"), formatTanggal(format(date, "yyyy-MM-dd"), "date"), "Dinas", v.description, v.skpd_id)
                    })
                })

                await Promise.all([...querySKPD, ...queryAttendance])
                return { message: "SKPD Berhasil disimpan" }
            } else {
                const updateSKPD = tx.$executeRawUnsafe(`
                    UPDATE SKPD SET sppd_id=?,payroll=?,real_start=?,real_end=?,status=?,approve=? WHERE skpd_id=?`,
                    data.sppd_id, data.payroll, data.date[0], data.date[1], data.status, data.approve, data.skpd_id)

                const deleteAttendanceFromSKPD = tx.$executeRawUnsafe(`DELETE FROM attendance WHERE reference = ?`, data.skpd_id)

                const insertAttendanceFromSKPD = data.skpd_detail.flatMap((v: any) => {
                    return eachDayOfInterval({ start: data.date[0], end: data.date[1] }).map(date => {
                        return tx.$executeRawUnsafe(`
                            INSERT INTO attendance(attendance_id,user_id_machine,check_in,check_out,type,description,reference) 
                            VALUES(UUID(), ?, ?, ?, ?, ?, ?)`,
                            data.user_id_machine, formatTanggal(format(date, "yyyy-MM-dd"), "date"), formatTanggal(format(date, "yyyy-MM-dd"), "date"), "Dinas", v.description, v.skpd_id)
                    })
                })

                await Promise.all([updateSKPD, deleteAttendanceFromSKPD, ...insertAttendanceFromSKPD])

                return { message: "SKPD Berhasil diubah" }
            }
        })

        return json(status);
    } catch (err: any) {
        error(500, prismaErrorHandler(err))
    }
}