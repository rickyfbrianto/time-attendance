import { error, json } from "@sveltejs/kit";
import { encryptData, prismaErrorHandler } from "@lib/utils";
import { prisma } from '@lib/utils.js'

export async function GET({url}){
    const page = Number(url.searchParams.get('_page')) || 1
    const limit = Number( url.searchParams.get('_limit')) || 10
    const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') ?? "payroll"
    const order = url.searchParams.get('_order') ?? "asc"
    const search = url.searchParams.get('_search') ?? ""
        
    let where = "WHERE 1=1 " + 
    (search ? ` AND e.payroll like '%${search}%' OR e.name like '%${search}%' OR e.position like '%${search}%'
        OR d.name like '%${search}%' OR e.location like '%${search}%' OR e.email like '%${search}%'` :"")

    const status = await prisma.$transaction(async (tx) =>{
        const items = await tx.$queryRawUnsafe(`
            SELECT e.payroll, e.name, e.position, d.name as dept, e.location, e.email FROM employee e
            LEFT JOIN dept d ON e.department = d.dept_code
            ${where}
            ORDER by ${sort} ${order}
            LIMIT ${limit} OFFSET ${offset}`)

        const [{count}] = await tx.$queryRawUnsafe(`SELECT count(*) as count FROM employee e
            LEFT JOIN dept d ON e.department = d.dept_code ${where}`) as {count:number}[]

        return {items, totalItems: Number(count)}
    })
    
    return json(status)
}

export async function POST({ request }) {
    try {
        const data = await request.json();

        const status = await prisma.$transaction(async (tx) => {
            const getUser = await tx.employee.findFirst({
                where:{payroll : data.payroll }
            })

            if(!getUser){
                await prisma.employee.create({
                    data:{...data,
                        password: encryptData(data.password, import.meta.env.VITE_KEY)
                    }
                })
                
                return { message: "User successfully saved" }
            }else{
                await prisma.employee.update({
                    data:{ ...data },
                    where:{ payroll : data.payroll }
                })
                return { message: "User successfully updated" }
            }
        })

        return json(status)
    } catch (err) {
        console.log(err)
        error(500, { message: prismaErrorHandler(err) });
    }
}