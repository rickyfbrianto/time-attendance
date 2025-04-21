import { error, json } from "@sveltejs/kit";
import { prisma } from '@lib/utils.js'

export async function GET({url}){
    const page = Number(url.searchParams.get('_page')) || 1
    const limit = Number(url.searchParams.get('_limit')) || 10
    const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') ?? "spl_id"
    const order = url.searchParams.get('_order') ?? "asc"
    const search = url.searchParams.get('_search') ?? ""
    
    const payroll = url.searchParams.get('payroll')
    
    const status = await prisma.$transaction(async (tx) => {     
        const items = await tx.$queryRawUnsafe(`
            select s.spl_id, s.purpose, s.est_start, s.est_end, approval1.name as approval1, s.status1 from spl as s
            LEFT JOIN employee as approval1 ON approval1.payroll = s.approval1
            WHERE (s.approval1 = ? AND s.status1 = 'Waiting' AND s.status2 = 'Waiting')
            ORDER by ${sort} ${order} LIMIT ? OFFSET ?`,
            payroll, limit, offset)

        const [{count}] = await tx.$queryRawUnsafe(`SELECT count(*) as count FROM spl as s
            LEFT JOIN employee as approval1 ON approval1.payroll = s.approval1
            WHERE (s.approval1 = ? AND s.status1 = 'Waiting' AND s.status2 = 'Waiting')`,
            payroll) as {count:number}[]
        return {items, totalItems: Number(count)}
    })
    return json(status)
}

export async function POST({ request }) {
    try {        
        const data = await request.json();
        
        const status = await prisma.$transaction(async tx =>{
            await tx.spl.update({
                data:{ status1: data.status },
                where: { spl_id: data.spl_id }
            })

            return {message:`SPL Approval 1 successfully ${data.status}`}
        })

        return json(status);
    } catch (err:any) {
        console.log("err catch",err);
        error(500, err.message)
    }
}