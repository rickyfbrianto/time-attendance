import { cekRules, formatTanggal, formatTanggalISO, prismaErrorHandler, safeDate } from "@lib/utils";
import { error, json } from "@sveltejs/kit";
import { v4 as uuid4} from "uuid";
import { prisma } from '@lib/utils.js'
import { eachDayOfInterval, formatDate, getYear, format, getDay, parseISO, formatISO } from "date-fns";

export async function GET({url}){
    try {
        const page = Number(url.searchParams.get('_page')) || 1
        const limit = Number(url.searchParams.get('_limit')) || 10
        const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
        const sort = url.searchParams.get('_sort') || "att.check_in"
        const order = url.searchParams.get('_order') || "asc"
        const search = url.searchParams.get('_search') || ""
        
        const dept = url.searchParams.get('dept') || ""
        const payroll = url.searchParams.get('payroll') || ""
        
        const status = await prisma.$transaction(async (tx) =>{
            const items = await tx.$queryRawUnsafe(`SELECT 
                att.attendance_id, att.user_id_machine, user.name, user.payroll, att.check_in AS check_in, att.check_out AS check_out, att.description, att.type, att.ijin_info 
                FROM attendance as att
                LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                WHERE (att.user_id_machine, DATE(att.check_in)) IN (
                    SELECT user_id_machine, DATE(check_in) FROM attendance 
                    GROUP BY user_id_machine, DATE(check_in) HAVING COUNT(*) > 1
                ) ORDER by ${sort} ${order}
                LIMIT ${limit} OFFSET ${offset}`)
            
            const [{count}] = await tx.$queryRawUnsafe(`SELECT CAST(COUNT(*) as UNSIGNED) as count FROM (
                SELECT att.attendance_id, att.user_id_machine, user.name, user.payroll, att.check_in AS check_in, att.check_out AS check_out FROM attendance as att
                LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                WHERE (att.user_id_machine, DATE(att.check_in)) IN (
                    SELECT user_id_machine, DATE(check_in) FROM attendance
                    GROUP BY user_id_machine, DATE(check_in) HAVING COUNT(*) > 1
                )) as tmp`) as {count:number}[]
            const totalItems = Number(count)
            return {items, totalItems}
        })
                
        return json(status)
    } catch (error) {
        console.log("err catch",error);
        return {error}
    }
}