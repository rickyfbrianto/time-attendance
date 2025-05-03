import { error, json } from "@sveltejs/kit";
import { encryptData, prismaErrorHandler } from "@lib/utils";
import { extname } from "node:path";
import { writeFile } from 'fs/promises'
import { writeFileSync } from 'fs'
import path from 'path'
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
        const data = await request.formData()
        const signature = data.get('signature')
        const isSignature = typeof signature == "object" ? true : false
        const fileSignature = isSignature ? data.get('payroll') + extname(signature?.name || "") : ""

        const status = await prisma.$transaction(async (tx) => {
            const getUser = await tx.employee.findFirst({
                where:{payroll : data.get('payroll') }
            })

            if(!getUser){
                const createUser = await prisma.employee.create({
                    data:{
                        payroll: data.get('payroll'),
                        profile_id: data.get('profile_id'),
                        user_id_machine: data.get('user_id_machine'),
                        name: data.get('name'),
                        password: encryptData(data.get('password'), import.meta.env.VITE_KEY),
                        position: data.get('position'),
                        department: data.get('department'),
                        location: data.get('location'),
                        phone: data.get('phone'),
                        workhour: Number(data.get('workhour')),
                        email: data.get('email'),
                        approver: data.get('approver'),
                        substitute: data.get('substitute'),
                        signature: isSignature ? fileSignature : "",
                        status: data.get('status'),
                    }
                })
                
                if(createUser && isSignature){
                    const uploadsDir = path.join(process.env.ATTACH_SIGNATURE, fileSignature)
                    const filePath = path.resolve(uploadsDir);
                    writeFileSync(filePath, Buffer.from(await signature?.arrayBuffer()));
                }
                
                return { message: "User successfully saved" }
            }else{
                const updateUser = await prisma.employee.update({
                    data:{ 
                        profile_id: data.get('profile_id'),
                        user_id_machine: data.get('user_id_machine'),
                        name: data.get('name'),
                        position: data.get('position'),
                        department: data.get('department'),
                        location: data.get('location'),
                        phone: data.get('phone'),
                        workhour: Number(data.get('workhour')),
                        email: data.get('email'),
                        approver: data.get('approver'),
                        substitute: data.get('substitute'),
                        signature: isSignature ? fileSignature : signature,
                        status: data.get('status'),
                    },
                    where:{ payroll : data.get('payroll') }
                })
                
                if(updateUser && isSignature){
                    const uploadsDir = path.join(process.env.ATTACH_SIGNATURE, fileSignature)
                    const filePath = path.resolve(uploadsDir);
                    writeFileSync(filePath, Buffer.from(await signature?.arrayBuffer()));
                }
                
                return { message: "User successfully updated" }
            }
        })

        return json(status)
    } catch (err) {
        error(500, prismaErrorHandler(err))
    }
}