import {error, json} from '@sveltejs/kit'
import {prisma } from '@lib/utils'
import { v4 } from 'uuid'

export async function GET({url}){
    try {
        const page = Number(url.searchParams.get('_page')) || 1
        const limit = Number(url.searchParams.get('_limit')) || 10
        const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
        const sort = url.searchParams.get('_sort') ?? "dept_id"
        const order = url.searchParams.get('_order') ?? "asc"
        const search = url.searchParams.get('_search') ?? ""

        let where = "WHERE 1=1 " + (search ? ` AND (dept_code like '%${search}%' OR name like '%${search}%' OR status like '%${search}%')` :"")
        
        const status = await prisma.$transaction(async (tx) => {
            const items = await tx.$queryRawUnsafe(`
                SELECT * FROM dept 
                ${where}
                ORDER by ${sort} ${order}
                LIMIT ${limit} OFFSET ${offset}`)

            const totalItems = await tx.$queryRawUnsafe(`SELECT COUNT(*) as count FROM dept ${where}`)

            return {items, totalItems: Number( totalItems[0].count)}
        })
        
        return json(status)
    } catch (err: any) {
        console.log(err.message)
        error(500, err.messsage)        
    }
}

export async function POST({request}){
    try {
        const data = await request.json()

        const status = await prisma.$transaction(async tx => {
            const getDept = await prisma.dept.findUnique({
                where:{dept_id: data.dept_id}
            })

            if(!getDept){
                await tx.dept.create({
                    data:{
                        ...data,
                        dept_id: v4()
                    }
                })
                
                return {message:"Data successfully saved"}
            }else{
                await tx.dept.update({
                    data:{
                        dept_code: data.dept_code,
                        initial: data.initial,
                        name:data.name, 
                        status:data.status
                    }, where:{
                        dept_id: data.dept_id
                    }
                })
                return {message:"Data successfully updated"}
            }
        })

        return json(status)
    } catch (err: any) {
        error(500, err.message)
    }
}