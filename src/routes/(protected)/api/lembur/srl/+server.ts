import { DateTime } from "luxon";
import { error, json } from "@sveltejs/kit";
import { checkFieldKosong, prismaErrorHandler } from "@lib/utils";
import { v4 as uuid4 } from "uuid";
import { prisma } from '@lib/utils.js'
import { format } from "date-fns";

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

        data.srl_detail.forEach((val:{status:string, description:string}, i: number) => {
            if(!val.description.trim()) throw new Error(`Description ${i + 1} masih kosong`)
        });

        const dataSRLDetail: {status:string, description:string}[] = []
        data.srl_detail.forEach((val:{status:string, description:string}) => {
            dataSRLDetail.push({status: val.status, description: val.description})
        })
        
        const status = await prisma.$transaction(async tx =>{
            const getSRL = await tx.srl.findUnique({
                where:{srl_id : data.srl_id}
            })

            if(!getSRL){
                let newID
                const dept = await tx.dept.findUnique({where:{dept_code: data.dept}})
                
                const tempID = await tx.$queryRawUnsafe(`
                SELECT srl_id as id from srl 
                    WHERE 
                    SUBSTRING_INDEX(SUBSTRING_INDEX(srl_id, '-', 2), '-', -1) = '${dept?.name}' AND 
                    SUBSTRING_INDEX(SUBSTRING_INDEX(srl_id, '-', 3), '-', -1) = year(now()) AND 
                    SUBSTRING_INDEX(SUBSTRING_INDEX(srl_id, '-', 4), '-', -1) = month(now())
                ORDER by spl_id desc limit 0,1`)
                if(tempID.length > 0){
                    newID = tempID[0].id.split('-')
                    const lastID = Number(newID[newID.length-1]) + 1
                    newID[newID.length-1] = lastID
                    newID = newID.join('-')
                }else{
                    newID = `SRL-${dept?.name}-${format(new Date(), "yyyy-MM")}-1`
                }
                
                await tx.$queryRawUnsafe(`
                    INSERT INTO srl (srl_id, spl_id, payroll, real_start, real_end, status, createdBy, createdAt) 
                    VALUES(?,?,?,?,?,?,?, now())`,
                    newID, data.spl_id, data.payroll, new Date(data.real_start + " UTC"), 
                    new Date(data.real_end + " UTC"), "CLOSE", data.createdBy)

                await tx.srl_detail.createMany({
                    data: dataSRLDetail.map(({status, description}) => ({
                        srl_detail_id: uuid4(),
                        srl_id: newID,
                        description, status
                    }))
                })

                return { message: "Data successfully saved" }
            }else{
                await tx.srl.update({
                    data:{
                        real_start: new Date(data.real_start + " UTC"),
                        real_end: new Date(data.real_end + " UTC"),
                    },
                    where:{ srl_id: data.srl_id }
                })

                await tx.srl_detail.deleteMany({
                    where : { srl_id: data.srl_id }
                })

                await tx.srl_detail.createMany({
                    data: dataSRLDetail.map(({status, description}) => ({
                        srl_detail_id: uuid4(),
                        srl_id: data.srl_id,
                        description, status
                    }))
                })

                return { message: "Data successfully updated" }
            }
        })

        return json(status);
    } catch (err:any) {
        console.log("err catch",err);
        error(500, err.message)
    }
}