import { error, json } from "@sveltejs/kit";
import { prisma } from '@lib/utils.js'
import { getYear, format, subMonths } from "date-fns";

export async function GET({url}){
    try {
        const page = Number(url.searchParams.get('_page')) || 1
        const limit = Number(url.searchParams.get('_limit')) || 10
        const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
        const sort = url.searchParams.get('_sort') || "att.check_in"
        const order = url.searchParams.get('_order') || "asc"
        const search = url.searchParams.get('_search') || ""
        
        const payroll = url.searchParams.get('payroll') || ""
        const year = url.searchParams.get('year') || ""
        const month = url.searchParams.get('month') || ""
        
        const status = await prisma.$transaction(async (tx) =>{
            const getSetting = await tx.setting.findFirst()
            const temp = new Date(Number(year), Number(month), getSetting?.start_periode)
            const date1 = format(subMonths(temp, 1), "yyyy-MM-dd")
            const date2 = format(new Date(Number(year), Number(month), getSetting?.end_periode), "yyyy-MM-dd")
            
            const items = await tx.$queryRawUnsafe(`SELECT att.attendance_id, att.user_id_machine, user.name, user.payroll, att.check_in AS check_in, att.check_out AS check_out, 
                att.description, att.type, att.ijin_info, 
                GetStartOvertime( att.check_in, att.check_out, user.workhour) AS lembur_start,
                RoundCheckOut( att.check_in, att.check_out) as lembur_end
                FROM
                    attendance AS att
                    LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                    WHERE user.payroll like ? AND (att.check_in like ?) AND DATE(check_in) BETWEEN ? AND ?
                    ORDER by ${sort} ${order}
                    LIMIT ${limit} OFFSET ${offset}`,
                `%${payroll}%`, `%${search}%`, date1, date2)
            
            const [{count}] = await tx.$queryRawUnsafe(`SELECT CAST(COUNT(*) as UNSIGNED) as count FROM (
                SELECT att.attendance_id FROM
                    attendance AS att
                    LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                    WHERE user.payroll like ? AND (att.check_in like ?) AND DATE(check_in) BETWEEN ? AND ?
                    ) as tmp`,
                `%${payroll}%`, `%${search}%`, date1, date2) as {count:number}[]
            const totalItems = Number(count)
            return {items, totalItems}
        })
                
        return json(status)
    } catch (error) {
        console.log("err catch",error);
        return {error}
    }
}