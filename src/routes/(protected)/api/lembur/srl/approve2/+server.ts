import { error, json, type RequestHandler } from "@sveltejs/kit";
import { prisma, prismaErrorHandler } from '@lib/utils.js'

export const GET: RequestHandler = async ({ url }) => {
    const page = Number(url.searchParams.get('_page')) || 1
    const limit = Number(url.searchParams.get('_limit')) || 10
    const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') ?? "srl_id"
    const order = url.searchParams.get('_order') ?? "asc"
    
    const payroll = url.searchParams.get('payroll')
    
    const status = await prisma.$transaction(async (tx) => {     
        const items = await tx.$queryRawUnsafe(`
            select s.srl_id, s.payroll, s.real_start, s.real_end, approval2.name as approval2, s.status2 from srl as s
            LEFT JOIN employee as approval2 ON approval2.payroll = s.approval2
            WHERE (s.approval2 = ? AND s.status1 = 'Approved' AND s.status2 = 'Waiting')
            ORDER by ${sort} ${order} LIMIT ? OFFSET ?`,
            payroll, limit, offset)

        const [{count}] = await tx.$queryRawUnsafe(`SELECT count(*) as count FROM srl as s
            LEFT JOIN employee as approval2 ON approval2.payroll = s.approval2
            WHERE (s.approval2 = ? AND s.status1 = 'Approved' AND s.status2 = 'Waiting')`,
            payroll) as {count:number}[]
        return {items, totalItems: Number(count)}
    })
    return json(status)
}

export const POST: RequestHandler = async ({ request }) => {
    try {        
        const data = await request.json();
        
        const status = await prisma.$transaction(async tx =>{
            await tx.srl.update({
                data:{ status2: data.status },
                where: { 
                    srl_id: data.srl_id,
                    status1: "Approved",
                    status2: "Waiting"
                }
            })

            return {message:`SRL Approval 2 successfully ${data.status}`}
        })

        return json(status);
    } catch (err:any) {
        error(500, prismaErrorHandler(err))
    }
}