import { error, json } from "@sveltejs/kit";
import { v4 as uuid4 } from "uuid";
import { prisma, prismaErrorHandler } from '@lib/utils.js'
import { format } from "date-fns";

export async function GET({url}){
    const page = Number(url.searchParams.get('_page')) || 1
    const limit = Number(url.searchParams.get('_limit')) || 10
    const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') ?? "srl_id"
    const order = url.searchParams.get('_order') ?? "asc"
    const search = url.searchParams.get('_search') ?? ""
    
    const status = await prisma.$transaction(async (tx) => {        
        const items = await tx.$queryRawUnsafe(`
            SELECT srl_id, spl_id, srl.payroll, real_start, real_end, e.name,
            approval1.name as approval1, status1, approval2.name as approval2, status2 FROM srl
            LEFT JOIN employee as e ON e.payroll = srl.payroll
            LEFT JOIN employee as approval1 ON approval1.payroll = srl.approval1
            LEFT JOIN employee as approval2 ON approval2.payroll = srl.approval2
            WHERE srl_id LIKE ? OR spl_id LIKE ? OR srl.payroll LIKE ? OR e.name LIKE ?
            ORDER by ${sort} ${order} LIMIT ? OFFSET ?`,
            `%${search}%`,`%${search}%`,`%${search}%`,`%${search}%`,limit, offset)

        const [{count}] = await tx.$queryRawUnsafe(`SELECT COUNT(*) as COUNT FROM srl
            LEFT JOIN employee as e ON e.payroll = srl.payroll
            LEFT JOIN employee as approval1 ON approval1.payroll = srl.approval1
            LEFT JOIN employee as approval2 ON approval2.payroll = srl.approval2
            WHERE srl_id LIKE ? OR spl_id LIKE ? OR srl.payroll LIKE ? OR e.name LIKE ?`,
            `%${search}%`,`%${search}%`,`%${search}%`,`%${search}%`) as {count: number}[]
                    
        return {items, totalItems: Number(count)}
    })

    return json(status)
}

export async function POST({ request,  }) {
    try {        
        const data = await request.json();

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
                const separator = "_"
                const dept = data.spl_id.split(separator)[1]

                const [{id}] = await tx.$queryRawUnsafe(`
                    SELECT 
                    IFNULL(MAX(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(srl_id, '${separator}', 1), '-', 1) AS unsigned)), 0) as id 
                    from SRL WHERE 
                    SUBSTRING_INDEX(SUBSTRING_INDEX(srl_id, '${separator}', 2), '${separator}', -1) = ? AND
                    SUBSTRING_INDEX(SUBSTRING_INDEX(srl_id, '${separator}', -1), '-', 1) = month(now()) AND 
                    SUBSTRING_INDEX(SUBSTRING_INDEX(srl_id, '${separator}', -1), '-', -1) = year(now())`,
                dept) as {id: number}[]
                const lastID = Number(id) + 1
                newID = `${lastID}-SRL${separator}${dept}${separator}STM${separator}${format(new Date(), "MM-yyyy")}`

                await tx.$queryRawUnsafe(`
                    INSERT INTO srl (srl_id, spl_id, payroll, real_start, real_end, approval1,approval2,createdAt) 
                    VALUES(?,?,?,?,?,?,?,now())`,
                    newID, data.spl_id, data.payroll, data.real_start, data.real_end, data.approval1, data.approval2)

                await tx.srl_detail.createMany({
                    data: dataSRLDetail.map(({status, description}) => ({
                        srl_detail_id: uuid4(),
                        srl_id: newID,
                        description, status
                    }))
                })

                return { message: "Data successfully saved" }
            }else{
                const updateSRL = await tx.$executeRawUnsafe(`
                    UPDATE SRL SET real_start=?,real_end=?,approval1=?,approval2=? WHERE srl_id=? AND status1 = ? AND status2 = ?`,
                    data.real_start, data.real_end, data.approval1, data.approval2, data.srl_id, 'Waiting', 'Waiting'
                )

                if(!updateSRL) throw new Error("Cant update SRL, because status is changed")

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
        error(500, prismaErrorHandler(err))
    }
}