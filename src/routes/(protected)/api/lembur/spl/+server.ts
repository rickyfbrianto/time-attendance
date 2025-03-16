import { error, json } from "@sveltejs/kit";
import { checkFieldKosong, prismaErrorHandler } from "@lib/utils";
import { v4 as uuid4 } from "uuid";
import { prisma } from '@lib/utils.js'

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
                est_start:true,
                est_end:true,
                employee_payroll:{
                    select:{
                        name:true
                    }
                }
            },
            where:{
                OR:[
                    {payroll:{contains: search}},
                ]
            },
            orderBy:{[sort]: order}
        })
    
        const totalItems = await tx.spl.count({
            where:{
                OR:[
                    {payroll:{contains: search}},
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
            throw new Error(`${errorCount} input masih kosong`)
        }

        data.description.forEach((val:string, i: number) => {
            if(!val.trim()){
                throw new Error(`Description ${i + 1} masih kosong`)
            }
        });
        
        const status = prisma.$transaction(async tx =>{
            const getSPL = await tx.spl.findUnique({
                where:{spl_id : data.spl_id}
            })
            const spl_id = uuid4()

            if(!getSPL){
                await tx.spl.create({
                    data: {
                        spl_id: spl_id,
                        payroll: data.payroll,
                        est_start: new Date(data.est_start),
                        est_end: new Date(data.est_end),
                        createdBy: data.createdBy
                    },
                })

                await tx.spl_detail.createMany({
                    data: data.description.map((val:string, i: number) => ({
                        spl_detail_id: uuid4(),
                        spl_id: spl_id,
                        step: i,
                        description: val
                    }))
                })
            }else{
                await tx.spl.update({
                    data:{
                        payroll: data.payroll,
                        est_start: new Date(data.est_start),
                        est_end: new Date(data.est_end),
                    },
                    where:{ spl_id: data.spl_id }
                })

                await tx.spl_detail.deleteMany({
                    where : { spl_id: data.spl_id }
                })

                await tx.spl_detail.createMany({
                    data: data.description.map((val:string, i: number) => 
                        ({
                            spl_detail_id: uuid4(),
                            spl_id: data.spl_id,
                            step: i,
                            description: val
                        })
                    )
                })
            }
            return { message: "Data successfully saved" }
        }, {
            maxWait: 5000,
            timeout: 10000,
        })

        return json(status);
    } catch (err:any) {
        console.log("err catch",err);
        error(500, err.message)
    }
}