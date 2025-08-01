import { json } from '@sveltejs/kit'
import { prisma } from '$/lib/utils.js'

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
        const start_date = url.searchParams.get('start_date') || ""
        const end_date = url.searchParams.get('end_date') || ""

        const tempDept = dept.split(",").filter(v => v).map((v) => '?').join(', ')

        const status = await prisma.$transaction(async (tx) => {
            const items = await tx.$queryRawUnsafe(`SELECT user.payroll, user.name, 
                att.check_in, att.check_out, att.check_in2, att.check_out2, 
                att.description, att.type, att.ijin_info, att.attachment, user.start_work, user.overtime, profile.level, profile.user_hrd,
                getUserWeekend(att.check_in, user.workhour) as isWeekend,
                getStartOvertime(att.attendance_id, user.workhour, user.start_work) AS lembur_start,
                roundCheckOut( att.check_in, att.check_out) as lembur_end
                FROM
                    attendance AS att
                    LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                    LEFT JOIN profile as profile on user.profile_id = profile.profile_id
                    WHERE (att.check_in like ?)
                    AND (DATE(att.check_in) BETWEEN ? AND ? AND user.payroll like ? AND user.department like ? AND type IN ('HKC','HKM'))
                    ORDER by ${sort} ${order}
                    LIMIT ${limit} OFFSET ${offset}`,
                `%${search}%`, start_date, end_date, `%${payroll}%`, `%${dept}%`)

            const [{ count }] = await tx.$queryRawUnsafe(`SELECT CAST(COUNT(*) as UNSIGNED) as count FROM (
                SELECT att.attendance_id FROM
                    attendance AS att
                    LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                    WHERE (DATE(att.check_in) BETWEEN ? AND ? AND user.payroll like ? AND user.department like ? AND type IN ('HKC','HKM'))
                ) as tmp`,
                start_date, end_date, `%${payroll}%`, `%${dept}%`) as { count: number }[]
            const totalItems = Number(count)
            return { items, totalItems }
        })

        return json(status)
    } catch (error) {
        console.log("err catch", error);
        return { error }
    }
}