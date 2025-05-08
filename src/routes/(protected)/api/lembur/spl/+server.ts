import { error, json } from "@sveltejs/kit";
import { formatTanggalISO, isEmpty, prismaErrorHandler } from "@lib/utils";
import { v4 as uuid4 } from "uuid";
import { prisma } from '@lib/utils.js'
import { format } from "date-fns";

export async function GET({url}){
    const page = Number(url.searchParams.get('_page')) || 1
    const limit = Number(url.searchParams.get('_limit')) || 10
    const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') ?? "est_start"
    const order = url.searchParams.get('_order') ?? "asc"
    const search = url.searchParams.get('_search') ?? ""
    
    const dept = url.searchParams.get('dept') || ""
    const payroll = url.searchParams.get('payroll') || ""
    
    const status = await prisma.$transaction(async (tx) => {     
        const items = await tx.$queryRawUnsafe(`
            SELECT s.spl_id, s.purpose, s.est_start, s.est_end, approval1.name as approval1, s.status1, approval2.name as approval2, s.status2 FROM SPL as s
			LEFT JOIN spl_detail sd ON sd.spl_id = s.spl_id
            LEFT JOIN employee as approval1 ON approval1.payroll = s.approval1
            LEFT JOIN employee as approval2 ON approval2.payroll = s.approval2
            WHERE (s.spl_id like ? OR s.purpose like ? OR s.est_start like ? OR s.est_end like ?) AND sd.payroll like ?
            GROUP BY s.spl_id
            ORDER by ${sort} ${order} LIMIT ? OFFSET ?`,
        `%${search}%`,`%${search}%`,`%${search}%`,`%${search}%`, `%${payroll}%`, limit, offset)

        const [{count}] = await tx.$queryRawUnsafe(`SELECT COUNT(*) as count FROM (
            SELECT s.spl_id FROM SPL as s
                LEFT JOIN spl_detail sd ON sd.spl_id = s.spl_id
                LEFT JOIN employee as approval1 ON approval1.payroll = s.approval1
                LEFT JOIN employee as approval2 ON approval2.payroll = s.approval2
                WHERE (s.spl_id like ? OR s.purpose like ? OR s.est_start like ? OR s.est_end like ?) AND sd.payroll like ?
                GROUP BY s.spl_id
            ) as tmp;`,
        `%${search}%`,`%${search}%`,`%${search}%`,`%${search}%`, `%${payroll}%`) as {count: number}[]
                    
        return {items, totalItems: Number(count)}
    })

    return json(status)
}

export async function POST({ request,  }) {
    try {        
        const data = await request.json();

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
                const separator = "_"
                const dept = await tx.dept.findUnique({where:{dept_code: data.dept}})

                const [{id}] = await tx.$queryRawUnsafe(`
                    SELECT 
                    IFNULL(MAX(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(spl_id, '${separator}', 1), '-', 1) AS unsigned)), 0) as id 
                    from SPL WHERE 
                    SUBSTRING_INDEX(SUBSTRING_INDEX(spl_id, '${separator}', 2), '${separator}', -1) = ? AND
                    SUBSTRING_INDEX(SUBSTRING_INDEX(spl_id, '${separator}', -1), '-', 1) = month(now()) AND 
                    SUBSTRING_INDEX(SUBSTRING_INDEX(spl_id, '${separator}', -1), '-', -1) = year(now())`,
                    dept?.initial) as {id: number}[]
                const lastID = Number(id) + 1
                newID = `${lastID}-SPL${separator}${dept?.initial}${separator}STM${separator}${format(new Date(), "MM-yyyy")}`
                
                await tx.$queryRawUnsafe(`
                    INSERT INTO SPL (spl_id,purpose,dept,est_start,est_end,approval1,approval2, createdAt) VALUES (?,?,?,?,?,?,?, now())`,
                    newID, data.purpose, data.dept, formatTanggalISO(data.est_start), formatTanggalISO(data.est_end), data.approval1, data.approval2
                )

                await tx.spl_detail.createMany({
                    data: dataSPLDetail.map(({payroll, description}, step) => ({
                        spl_detail_id: uuid4(),
                        spl_id: newID,
                        payroll, step, description
                    }))
                })

                return { message: "Data successfully saved" }
            }else{
                const updateSPL = await tx.$executeRawUnsafe(`
                    UPDATE SPL SET purpose=?,est_start=?,est_end=?,approval1=?,approval2=? WHERE spl_id=? AND status1 = ? AND status2 = ?`,
                    data.purpose, data.est_start, data.est_end, data.approval1, data.approval2, data.spl_id, 'Waiting', 'Waiting'
                )

                if(!updateSPL) throw new Error("Cant update SPL, because data is changed")

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

                return { message: "Data successfully updated" }
            }
        })

        return json(status);
    } catch (err:any) {
        error(500, prismaErrorHandler(err))
    }
}