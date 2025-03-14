import { error, json } from "@sveltejs/kit";
import { checkFieldKosong, prismaErrorHandler } from "@lib/utils";
import { v4 as uuid4 } from "uuid";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET({url}){
    const page = Number(url.searchParams.get('_page')) || 1
    const limit = Number(url.searchParams.get('_limit')) || 10
    const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') ?? "spl_id"
    const order = url.searchParams.get('_order') ?? "asc"
    const search = url.searchParams.get('_search') ?? ""
    
    const status = await prisma.$transaction(async (tx) => {        
        const items = await tx.spl.findMany({
            skip:offset,
            take:limit,
            select:{
                spl_id:true,
                payroll:true,
                description:true,
                datetime_start:true,
                datetime_end:true,
                employee_payroll:{
                    select:{
                        name:true
                    }
                }
            },
            where:{
                OR:[
                    {payroll:{contains: search}},
                    {description:{contains: search}},
                ]
            },
            orderBy:{[sort]: order}
        })
    
        const totalItems = await tx.spl.count({
            where:{
                OR:[
                    {payroll:{contains: search}},
                    {description:{contains: search}},
                ]
            },
        })

        return {items, totalItems}
    },{
        maxWait: 5000,
        timeout: 10000,
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

        await prisma.spl.create({
                data: { ...data, 
                    spl_id: uuid4(),
                    datetime_start: new Date(data.datetime_start),
                    datetime_end: new Date(data.datetime_end),
                },
            })
        return json({ message: "Data successfully saved" });
    } catch (err) {
        console.log("err catch",err);
        error(500, { message: prismaErrorHandler(err) });
    }
}