import { error, json } from "@sveltejs/kit";
import { prisma, prismaErrorHandler } from '@lib/utils.js'

export async function GET({url}){
    const page = Number(url.searchParams.get('_page')) || 1
    const limit = Number(url.searchParams.get('_limit')) || 10
    const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') ?? "date"
    const order = url.searchParams.get('_order') ?? "asc"
    const search = url.searchParams.get('_search') ?? ""
    
    const payroll = url.searchParams.get('payroll')
    
    const status = await prisma.$transaction(async (tx) => {     
        const items = await tx.$queryRawUnsafe(`
            select c.*, e.name from cuti as c
            LEFT JOIN employee as e ON e.payroll = c.payroll
            WHERE c.approval = ? AND c.status = 'Waiting'
            ORDER by ${sort} ${order} LIMIT ? OFFSET ?`,
            payroll, limit, offset)

        const [{count}] = await tx.$queryRawUnsafe(`SELECT count(*) as count FROM cuti as c
            LEFT JOIN employee as e ON c.payroll = e.payroll
            WHERE e.approver = ? AND c.status = 'Waiting'`,
            payroll) as {count:number}[]
        return {items, totalItems: Number(count)}
    })
    return json(status)
}

export async function POST({ request }) {
    try {        
        const data = await request.json();
        
        const status = await prisma.$transaction(async tx =>{
            await tx.cuti.update({
                data:{ status: data.status },
                where: { 
                    cuti_id: data.cuti_id,
                    status: "Waiting",
                    approval: data.approval
                }
            })

            return {message:`Cuti successfully ${data.status}`}
        })

        return json(status);
    } catch (err:any) {
        error(500, prismaErrorHandler(err))
    }
}