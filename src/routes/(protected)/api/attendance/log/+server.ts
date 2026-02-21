import { json, type RequestHandler } from "@sveltejs/kit";
import { prisma } from '@lib/utils.js'
import { format, subMonths } from "date-fns";

export const GET: RequestHandler = async ({ url }) => {
    const page = Number(url.searchParams.get('_page')) || 1
    const limit = Number(url.searchParams.get('_limit')) || 10
    const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') || "att.check_in"
    const order = url.searchParams.get('_order') || "desc"
    const search = url.searchParams.get('_search') || ""

    const payroll = url.searchParams.get('payroll') || ""
    const year = url.searchParams.get('year') || ""
    const month = url.searchParams.get('month') || ""
    const type = url.searchParams.get('type') || ""

    const status = await prisma.$transaction(async (tx) => {
        const getSetting = await tx.setting.findFirst()
        const temp = new Date(Number(year), Number(month), getSetting?.start_periode)
        const date1 = format(subMonths(temp, 1), "yyyy-MM-dd")
        const date2 = format(new Date(Number(year), Number(month), getSetting?.end_periode), "yyyy-MM-dd")

        const items = await tx.$queryRawUnsafe(`SELECT att.attendance_id, att.user_id_machine, user.name, user.payroll, user.department as dept,
            att.check_in AS check_in, att.check_out AS check_out, att.check_in2, att.check_out2, 
            att.description, att.type, att.ijin_info, att.attachment, user.start_work, user.overtime, user.level, user.user_type,
            getUserWeekend(att.check_in, user.workhour) as isWeekend,
            getStartOvertime(att.attendance_id, user.workhour, user.start_work) AS lembur_start,
            roundCheckOut( att.check_in, att.check_out) as lembur_end,
            getLateInMinutes(att.attendance_id, user.workhour, user.start_work) as late_in_minute
            FROM
                attendance AS att
                LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                LEFT JOIN profile as profile on user.profile_id = profile.profile_id
                WHERE user.payroll like ? AND att.check_in like ? AND att.type like ? AND DATE(check_in) BETWEEN ? AND ?
                ORDER by ${sort} ${order}
                LIMIT ${limit} OFFSET ${offset}`,
            `%${payroll}%`, `%${search}%`, `%${type}%`, date1, date2)

        const [{ count }] = await tx.$queryRawUnsafe(`SELECT CAST(COUNT(*) as UNSIGNED) as count FROM (
            SELECT att.attendance_id FROM
                attendance AS att
                LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                LEFT JOIN profile as profile on user.profile_id = profile.profile_id
                WHERE user.payroll like ? AND att.check_in like ? AND att.type like ? AND DATE(check_in) BETWEEN ? AND ?
                ) as tmp`,
            `%${payroll}%`, `%${search}%`, `%${type}%`, date1, date2) as { count: number }[]
        const totalItems = Number(count)
        return { items, totalItems }
    })

    return json(status)
}