import { DateTime } from "luxon";
import { error, json } from "@sveltejs/kit";
import { checkFieldKosong, prismaErrorHandler } from "@lib/utils";
import { v4 as uuid4 } from "uuid";
import { prisma } from '@lib/utils.js'
import { format, formatISO } from "date-fns";

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
                est_start:true,
                est_end:true,
                employee_createdBy:{
                    select:{            
                        name:true
                    }
                }
            },
            where:{
                OR:[
                    {est_start:{equals:new Date(search + " UTC")}},
                    {est_end:{equals:new Date(search + " UTC")}},
                ]
            },
            orderBy:{[sort]: order}
        })
    
        const totalItems = await tx.spl.count({
            where:{
                OR:[
                    {est_start:{equals:new Date(search + " UTC")}},
                    {est_end:{equals:new Date(search + " UTC")}},
                ]
            },
        })

        return {items, totalItems}
    })

    return json(status)
}

export async function POST({ request,  }) {
    try {        
        const data = await request.json();
        const { isError, errorCount } = checkFieldKosong(data);
        if (isError) {
            throw new Error(`${errorCount} input masih kosong`)
        }

        data.spl_detail.forEach((val:{payroll:string, description:string}, i: number) => {
            if(!val.payroll.trim()) throw new Error(`Description ${i + 1} masih kosong`)
        });

        const dataSPLDetail: {payroll:string, description:string}[] = []
        data.spl_detail.forEach((val:{payroll:string, description:string}) => {
            if(val.description){
                const newDesc = val.description.split(',').filter(v => v).map(v => v.trim()).join(', ')
                dataSPLDetail.push({payroll: val.payroll, description: newDesc.trim()})
            }
        })
        
        const status = prisma.$transaction(async tx =>{
            const getSPL = await tx.spl.findUnique({
                where:{spl_id : data.spl_id}
            })
            const spl_id = uuid4()

            if(!getSPL){
                await tx.spl.create({
                    data: {
                        spl_id: spl_id,
                        est_start: new Date(data.est_start + " UTC"),
                        est_end: new Date(data.est_end + " UTC"),
                        createdBy: data.createdBy
                    },
                })

                await tx.spl_detail.createMany({
                    data: dataSPLDetail.map(({payroll, description}, step) => ({
                        spl_detail_id: uuid4(),
                        spl_id: spl_id,
                        payroll, step, description
                    }))
                })
            }else{
                await tx.spl.update({
                    data:{
                        est_start: new Date(data.est_start + " UTC"),
                        est_end: new Date(data.est_end + " UTC"),
                    },
                    where:{ spl_id: data.spl_id }
                })

                await tx.spl_detail.deleteMany({
                    where : { spl_id: data.spl_id }
                })

                await tx.spl_detail.createMany({
                    data: dataSPLDetail.map(({payroll, description}, step) => ({
                        spl_detail_id: uuid4(),
                        spl_id: data.spl_id,
                        payroll, step, description
                    }))
                })
            }
            return { message: "Data successfully saved" }
        })

        return json(status);
    } catch (err:any) {
        console.log("err catch",err);
        error(500, err.message)
    }
}