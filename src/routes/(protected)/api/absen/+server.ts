import {json} from '@sveltejs/kit'
import { prisma } from '@lib/utils.js'

export async function GET({url}){
    try {
        const page = Number(url.searchParams.get('_page')) || 1
        const limit = Number(url.searchParams.get('_limit')) || 10
        const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
        const sort = url.searchParams.get('_sort') ?? "check_in"
        const order = url.searchParams.get('_order') ?? "asc"
        const search = url.searchParams.get('_search') ?? ""
        
        const dept = url.searchParams.get('dept')
        const payroll = url.searchParams.get('payroll')
        let where = "WHERE 1=1 and type IN ('HKC','HKM') " + (dept ? ` AND user.department = '${dept}'` :"") + (payroll ? ` AND user.payroll = '${payroll}'` :"") 
        
        const status = await prisma.$transaction(async (tx) =>{
            const items = await tx.$queryRawUnsafe(`SELECT att.user_id_machine, user.payroll, user.name, att.check_in, att.check_out, att.description, att.type
                FROM
                    attendance AS att
                    LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                    ${where}
                ORDER by ${sort} ${order}
                LIMIT ${limit} OFFSET ${offset}`)
            
            const tempTotal = await tx.$queryRawUnsafe(`SELECT CAST(COUNT(*) as UNSIGNED) as count FROM (SELECT att.user_id_machine, user.payroll, user.name, att.check_in, att.check_out, att.description, att.type
                FROM
                    attendance AS att
                    LEFT JOIN employee as user on user.user_id_machine = att.user_id_machine
                    ${where}) as tmp`)
            const totalItems = Number(tempTotal[0].count)
            return {items, totalItems}
        })
                
        return json(status)
    } catch (error) {
        console.log("err catch",error);
        return {error}
    }
}