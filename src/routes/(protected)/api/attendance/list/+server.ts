import { prismaErrorHandler } from "@lib/utils";
import { error, json } from "@sveltejs/kit";
import { prisma } from '@lib/utils.js'

export async function GET({ url }) {
    try {
        const page = Number(url.searchParams.get('_page')) || 1
        const limit = Number(url.searchParams.get('_limit')) || 10
        const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
        const sort = url.searchParams.get('_sort') || "att.check_in"
        const order = url.searchParams.get('_order') || "desc"
        const search = url.searchParams.get('_search') || ""

        const dept = url.searchParams.get('dept') || ""
        const payroll = url.searchParams.get('payroll') || ""
        const type = url.searchParams.get('type') || ""

        const status = await prisma.$transaction(async (tx) => {
            const items = await tx.$queryRawUnsafe(`SELECT 
                att.attendance_id, att.user_id_machine, user.name, user.payroll, 
                att.check_in AS check_in, att.check_out AS check_out, att.check_in2, att.check_out2, 
                att.description, att.type, att.ijin_info, att.attachment, user.start_work, user.overtime, profile.level, profile.user_hrd, 
                getUserWeekend(att.check_in, user.workhour) as isWeekend,
                getStartOvertime(att.attendance_id, user.workhour, user.start_work) AS lembur_start,
                roundCheckOut( att.check_in, att.check_out) as lembur_end
                FROM 
                    attendance as att
                    LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                    LEFT JOIN profile as profile on user.profile_id = profile.profile_id
                    WHERE (user.department like ? AND user.payroll like ? AND att.type like ?) AND 
                    (att.user_id_machine, DATE(att.check_in)) IN (
                        SELECT user_id_machine, DATE(check_in) FROM attendance 
                        GROUP BY user_id_machine, DATE(check_in) HAVING COUNT(*) > 1
                    ) ORDER by ${sort} ${order}
                    LIMIT ${limit} OFFSET ${offset}`,
                `%${dept}%`, `%${payroll}%`, `%${type}%`)

            const [{ count }] = await tx.$queryRawUnsafe(`SELECT CAST(COUNT(*) as UNSIGNED) as count FROM (
                SELECT att.attendance_id, att.user_id_machine, user.name, user.payroll, att.check_in AS check_in, att.check_out AS check_out,
                att.description, att.type, att.ijin_info, att.attachment, user.start_work, user.overtime, profile.level, profile.user_hrd 
                FROM attendance as att
                LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                LEFT JOIN profile as profile on user.profile_id = profile.profile_id
                WHERE (user.department like ? AND user.payroll like ? AND att.type like ?) AND 
                (att.user_id_machine, DATE(att.check_in)) IN (
                    SELECT user_id_machine, DATE(check_in) FROM attendance
                    GROUP BY user_id_machine, DATE(check_in) HAVING COUNT(*) > 1
                )) as tmp`,
                `%${dept}%`, `%${payroll}%`, `%${type}%`) as { count: number }[]
            const totalItems = Number(count)
            return { items, totalItems }
        })

        return json(status)
    } catch (err) {
        error(500, prismaErrorHandler(err))
    }
}