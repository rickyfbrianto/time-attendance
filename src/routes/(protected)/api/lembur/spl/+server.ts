import { error, json } from "@sveltejs/kit";
import { checkFieldKosong, formatTanggal, isEmpty, prismaErrorHandler } from "@lib/utils";
import { v4 as uuid4 } from "uuid";
import { prisma } from '@lib/utils.js'
import { format } from "date-fns";

export async function GET({url}){
    const start_periode = url.searchParams.get('start_periode')
    const end_periode = url.searchParams.get('end_periode')

    const page = Number(url.searchParams.get('_page')) || 1
    const limit = Number(url.searchParams.get('_limit')) || 10
    const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') ?? "est_start"
    const order = url.searchParams.get('_order') ?? "asc"
    const search = url.searchParams.get('_search') ?? ""
    
    let where =  (search ? ` AND e.name = '${search}'` :"") 
    
    const status = await prisma.$transaction(async (tx) => {     
        const items = await tx.$queryRawUnsafe(`
            SELECT spl_id, purpose, est_start, est_end, e.name FROM SPL
            LEFT JOIN employee as e ON e.payroll = SPL.createdBy
            WHERE est_start between ? AND ? AND (spl_id like ? OR purpose like ? OR est_start like ? OR est_end like ?)
            ORDER by ${sort} ${order} LIMIT ? OFFSET ?`,
            start_periode, end_periode, `%${search}%`,`%${search}%`,`%${search}%`,`%${search}%`, limit, offset)

        const totalItems = await tx.$queryRawUnsafe(`SELECT COUNT(*) as count FROM SPL 
            LEFT JOIN employee as e ON e.payroll = SPL.createdBy 
            WHERE est_start between ? AND ? AND (spl_id like ? OR purpose like ? OR est_start like ? OR est_end like ?)`,
            start_periode, end_periode, `%${search}%`,`%${search}%`,`%${search}%`,`%${search}%`)
                    
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
            if(!val.payroll.trim() || !val.description.trim()) throw new Error(`Description ${i + 1} masih kosong`)
        });

        const dataSPLDetail: {payroll:string, description:string}[] = []
        data.spl_detail.forEach((val:{payroll:string, description:string}) => {
            if(val.description){
                const newDesc = val.description.split(',').filter(v => v).map(v => v.trim()).join(', ')
                dataSPLDetail.push({payroll: val.payroll, description: newDesc.trim()})
            }
        })
        
        const status = await prisma.$transaction(async tx =>{
            const getSPL = await tx.spl.findUnique({
                where:{spl_id : data.spl_id}
            })

            if(!getSPL){
                let newID
                const dept = await tx.dept.findUnique({where:{dept_code: data.dept}})

                const tempID = await tx.$queryRawUnsafe(`
                    SELECT spl_id as id from spl 
                        WHERE 
                        SUBSTRING_INDEX(SUBSTRING_INDEX(spl_id, '-', 2), '-', -1) = '${dept?.name}' AND 
                        SUBSTRING_INDEX(SUBSTRING_INDEX(spl_id, '-', 3), '-', -1) = year(now()) AND 
                        SUBSTRING_INDEX(SUBSTRING_INDEX(spl_id, '-', 4), '-', -1) = month(now())
                    ORDER by spl_id desc limit 0,1`)
                if(tempID.length > 0){
                    newID = tempID[0].id.split('-')
                    const lastID = Number(newID[newID.length-1]) + 1
                    newID[newID.length-1] = lastID
                    newID = newID.join('-')
                }else{
                    newID = `SPL-${dept?.name}-${format(new Date(), "yyyy-MM")}-1`
                }
                
                await tx.spl.create({
                    data: {
                        spl_id: newID,
                        purpose: data.purpose,
                        est_start: new Date(data.est_start + " UTC"),
                        est_end: new Date(data.est_end + " UTC"),
                        createdBy: data.createdBy,
                    },
                })

                await tx.spl_detail.createMany({
                    data: dataSPLDetail.map(({payroll, description}, step) => ({
                        spl_detail_id: uuid4(),
                        spl_id: newID,
                        payroll, step, description
                    }))
                })
            }else{
                await tx.spl.update({
                    data:{
                        purpose: data.purpose,
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