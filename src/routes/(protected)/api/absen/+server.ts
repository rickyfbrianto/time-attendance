import {json} from '@sveltejs/kit'
import { prisma } from '@lib/utils.js'

export async function GET({url}){
    try {
        const page = Number(url.searchParams.get('_page')) || 1
        const limit = Number(url.searchParams.get('_limit')) || 10
        const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
        const sort = url.searchParams.get('_sort') || "check_in"
        const order = url.searchParams.get('_order') || "asc"
        const search = url.searchParams.get('_search') || ""
        
        const dept = url.searchParams.get('dept') || ""
        const payroll = url.searchParams.get('payroll') || ""
        
        const status = await prisma.$transaction(async (tx) =>{
            const items = await tx.$queryRawUnsafe(`SELECT att.user_id_machine, user.payroll, user.name, att.check_in, att.check_out, 
                att.description, att.type, att.ijin_info,
                GetStartOvertime( att.check_in, att.check_out, user.workhour) AS lembur_start,
                RoundCheckOut( att.check_in, att.check_out) as lembur_end
                FROM
                    attendance AS att
                    LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                    WHERE (user.department like ? AND user.payroll like ?)  AND att.check_in like ?
                    ORDER by ${sort} ${order}
                    LIMIT ${limit} OFFSET ${offset}`,
                `%${dept}%`, `%${payroll}%`, `%${search}%`)
            
            const [{count}] = await tx.$queryRawUnsafe(`SELECT CAST(COUNT(*) as UNSIGNED) as count FROM (
                SELECT att.attendance_id FROM
                    attendance AS att
                    LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                    WHERE (user.department like ? AND user.payroll like ?)  AND att.check_in like ?
                ) as tmp`,
            `%${dept}%`, `%${payroll}%`, `%${search}%`) as {count:number}[]
            const totalItems = Number(count)
            return {items, totalItems}
        })

        return json(status)
    } catch (error) {
        console.log("err catch",error);
        return {error}
    }
}