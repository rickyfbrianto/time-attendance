import { json, type RequestHandler } from "@sveltejs/kit";
import { prisma } from '@lib/utils.js'

export const GET: RequestHandler<{ id: string }> = async ({ url }) => {
    const page = Number(url.searchParams.get('_page')) || 1
    const limit = Number(url.searchParams.get('_limit')) || 10
    const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') || "att.check_in"
    const order = url.searchParams.get('_order') || "asc"
    const search = url.searchParams.get('_search') || ""

    const dept = url.searchParams.get('dept') || ""
    const payroll = url.searchParams.get('payroll') || ""
    const type = url.searchParams.get('type') || ""
    const start_date = url.searchParams.get('start_date') || ""
    const end_date = url.searchParams.get('end_date') || ""

    const status = await prisma.$transaction(async (tx) => {
        const items = await tx.$queryRawUnsafe(`SELECT att.attendance_id, att.user_id_machine, user.name, user.payroll, 
            att.check_in AS check_in, att.check_out AS check_out, att.check_in2, att.check_out2, 
            att.description, att.type, att.ijin_info, att.attachment, user.start_work, user.overtime, user.level, user.user_type,
            getSPL(user.payroll, att.check_in) as is_spl_exist,
            getUserWeekend(att.check_in, user.workhour) as isWeekend,
            getStartOvertime(att.attendance_id, user.workhour, user.start_work) AS lembur_start,
            roundCheckOut( att.check_in, att.check_out) as lembur_end
            FROM
                attendance AS att
                LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                LEFT JOIN profile as profile on user.profile_id = profile.profile_id
                WHERE (att.check_in like ? OR user.name like ? OR user.payroll like ?) 
                AND user.department like ? AND user.payroll like ? AND att.type like ? AND DATE(check_in) BETWEEN ? AND ?
                ORDER by ${sort} ${order}
                LIMIT ${limit} OFFSET ${offset}`,
            `%${search}%`, `%${search}%`, `%${search}%`, `%${dept}%`, `%${payroll}%`, `%${type}%`, start_date, end_date)

        const [{ count }] = await tx.$queryRawUnsafe(`SELECT CAST(COUNT(*) as UNSIGNED) as count FROM (
            SELECT att.attendance_id FROM
                attendance AS att
                LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                LEFT JOIN profile as profile on user.profile_id = profile.profile_id
                WHERE (att.check_in like ? OR user.name like ? OR user.payroll like ?) 
                AND user.department like ? AND user.payroll like ? AND att.type like ? AND DATE(check_in) BETWEEN ? AND ?
                ) as tmp`,
            `%${search}%`, `%${search}%`, `%${search}%`, `%${dept}%`, `%${payroll}%`, `%${type}%`, start_date, end_date) as { count: number }[]
        const totalItems = Number(count)
        return { items, totalItems }
    })

    return json(status)
}