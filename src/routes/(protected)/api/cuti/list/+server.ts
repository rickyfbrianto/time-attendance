import { error, json } from "@sveltejs/kit";
import { prisma } from '@lib/utils.js'

export async function GET({url}){
    const page = Number(url.searchParams.get('_page')) || 1
    const limit = Number(url.searchParams.get('_limit')) || 10
    const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') ?? "date"
    const order = url.searchParams.get('_order') ?? "asc"
    const search = url.searchParams.get('_search') ?? ""

    const status = await prisma.$transaction(async (tx) => {     
        const items = await tx.$queryRawUnsafe(`
            SELECT c.*, e.name, approval.name as approval_name FROM cuti as c
            LEFT JOIN employee as e ON e.payroll = c.payroll
            LEFT JOIN employee as approval ON approval.payroll = c.approval
            ORDER by ${sort} ${order} LIMIT ? OFFSET ?`,
            limit, offset)

        const [{count}] = await tx.$queryRawUnsafe(`SELECT count(*) as count FROM cuti as c
            LEFT JOIN employee as e ON e.payroll = c.payroll
            LEFT JOIN employee as approval ON approval.payroll = c.approval`,
            ) as {count:number}[]
        return {items, totalItems: Number(count)}
    })
    return json(status)
}