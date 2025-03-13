import { error, json } from "@sveltejs/kit";
import { checkFieldKosong, encryptData, prismaErrorHandler } from "@lib/utils";
import { v4 as uuid4 } from "uuid";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET({url}){
    const page = parseInt( url.searchParams.get('_page')) || 1
    const limit = parseInt( url.searchParams.get('_limit')) || 10
    const offset = parseInt(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') ?? "payroll"
    const order = url.searchParams.get('_order') ?? "asc"
    const search = url.searchParams.get('_search') ?? ""
        
    const status = await prisma.$transaction(async (tx) =>{
        const items = await tx.employee.findMany({
            skip:offset,
            take:limit,
            where:{
                OR:[
                    {payroll:{contains: search}},
                    {name:{contains: search}},
                    {position:{contains: search}},
                ]
            },
            omit:{password:true},
            orderBy:{[sort]: order}
        })
    
        const totalItems = await tx.employee.count({
            where:{
                OR:[
                    {payroll:{contains: search}},
                    {name:{contains: search}},
                    {position:{contains: search}},
                ]
            },
        })

        return {items, totalItems}
    })

    return json(status)
}

export async function POST({ request }) {
    try {
        const data = await request.json();
        const { isError, errorCount } = checkFieldKosong(data);
        if (isError) {
            error(500, { message: `${errorCount} input masih kosong` });
        }

        await prisma.employee.create({
            data:{...data,
                password: encryptData(data.password, import.meta.env.VITE_KEY)
            }
        })
        return json({ message: "Data successfully saved" });
    } catch (err) {
        console.log(err)
        error(500, { message: prismaErrorHandler(err) });
    }
}

export async function PUT({ request }) {
    try {
        const data = await request.json();
        const { isError, errorCount } = checkFieldKosong(data);
        if (isError) {
            error(500, { message: `${errorCount} input masih kosong` });
        }
        const {payroll} = data
        delete data.payroll

        await prisma.employee.update({
            data:{...data},
            where:{payroll}
        })
        return json({ message: "Data successfully updated" });
    } catch (err) {
        console.log(err)
        error(500, { message: prismaErrorHandler(err) });
    }
}

