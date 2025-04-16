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
            SELECT i.*, e.name FROM ijin as i
            LEFT JOIN employee as e ON e.payroll = i.payroll
            WHERE i.status = 'Approved'
            ORDER by ${sort} ${order} LIMIT ? OFFSET ?`,
            limit, offset)

        const [{count}] = await tx.$queryRawUnsafe(`SELECT count(*) as count FROM ijin as i
            LEFT JOIN employee as e ON e.payroll = i.payroll
            WHERE i.status = 'Approved'`,
            ) as {count:number}[]
        return {items, totalItems: Number(count)}
    })
    return json(status)
}