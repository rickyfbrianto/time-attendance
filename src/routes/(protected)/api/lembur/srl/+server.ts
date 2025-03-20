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
    const sort = url.searchParams.get('_sort') ?? "srl_id"
    const order = url.searchParams.get('_order') ?? "asc"
    const search = url.searchParams.get('_search') ?? ""
    
    let where = "WHERE 1=1 " + (search ? "":"")
    
    const status = await prisma.$transaction(async (tx) => {        
        const items = await tx.$queryRawUnsafe(`
            SELECT srl_id, spl_id, srl.payroll, real_start, real_end, e.name FROM srl
            LEFT JOIN employee as e ON e.payroll = srl.payroll
            ${where}
            ORDER by ${sort} ${order} LIMIT ? OFFSET ?`,
            limit, offset)

        const totalItems = await tx.$queryRawUnsafe(`SELECT COUNT(*) as COUNT FROM srl
            LEFT JOIN employee as e ON e.payroll = srl.payroll
            ${where}`)
                    
        return {items, totalItems: Number(totalItems[0].count)}
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