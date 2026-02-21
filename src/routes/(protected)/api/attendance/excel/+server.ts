import { json, type RequestHandler } from "@sveltejs/kit";
import { prisma } from '@lib/utils.js'

export const GET: RequestHandler= async ({ url }) => {
    const filterAbsen = url.searchParams.get('filterAbsen') || ""
    const dept = url.searchParams.get('dept') || ""
    const type = url.searchParams.get('type') || ""
    const start_date = url.searchParams.get('start_date') || ""
    const end_date = url.searchParams.get('end_date') || ""

    const sqlFilterAbsen = filterAbsen == "Masuk" ? "AND (TIME(check_in) <> '00:00:00' OR TIME(check_out) <> '00:00:00')" : filterAbsen == "Tidak Masuk" ? "AND (TIME(check_in) = '00:00:00' AND TIME(check_out) = '00:00:00')" : ""

    const items = await prisma.$queryRawUnsafe(`SELECT att.attendance_id, att.user_id_machine, user.name, user.payroll, user.department as dept,
        att.check_in AS check_in, att.check_out AS check_out, att.check_in2, att.check_out2, 
        att.description, att.type, att.ijin_info
        FROM
            attendance AS att
            LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
            LEFT JOIN profile as profile on user.profile_id = profile.profile_id
            WHERE user.department like ? AND att.type like ? AND DATE(check_in) BETWEEN ? AND ? ${sqlFilterAbsen}`,
        `%${dept}%`, `%${type}%`, start_date, end_date)

    return json(items)
}