import { error, json } from "@sveltejs/kit";
import { checkFieldKosong, formatTanggal, isEmpty, prismaErrorHandler } from "@lib/utils";
import { v4 as uuid4 } from "uuid";
import { prisma } from '@lib/utils.js'
import { format } from "date-fns";

export async function GET({url}){
    const page = Number(url.searchParams.get('_page')) || 1
    const limit = Number(url.searchParams.get('_limit')) || 10
    const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') ?? "start_date"
    const order = url.searchParams.get('_order') ?? "asc"
    const search = url.searchParams.get('_search') ?? ""
    
    const status = await prisma.$transaction(async (tx) => {     
        const items = await tx.$queryRawUnsafe(`
            SELECT sppd_id, purpose, sppd.location, start_date, end_date, duration, e.name FROM SPPD
            LEFT JOIN employee as e ON e.payroll = SPPD.createdBy
            WHERE sppd_id like ? OR purpose like ? OR start_date like ? OR end_date like ? OR e.name like ?
            ORDER by ${sort} ${order} LIMIT ? OFFSET ?`,
            `%${search}%`,`%${search}%`,`%${search}%`,`%${search}%`,`%${search}%`, limit, offset)

        const [{count}] = await tx.$queryRawUnsafe(`SELECT COUNT(*) as count FROM SPPD
            LEFT JOIN employee as e ON e.payroll = SPPD.createdBy
            WHERE sppd_id like ? OR purpose like ? OR start_date like ? OR end_date like ? OR e.name like ?`,
            `%${search}%`,`%${search}%`,`%${search}%`,`%${search}%`,`%${search}%`) as {count: number}[]
                    
        return {items, totalItems: Number(count)}
    })

    return json(status)
}

export async function POST({ request,  }) {
    try {        
        const data = await request.json();
        
        const dataSPPDDetail: {payroll:string, description:string}[] = []
        data.sppd_detail.map((val:any) => {
            dataSPPDDetail.push({payroll: val.payroll, description: val.description})
        })        
        
        const status = await prisma.$transaction(async tx =>{
            const getSPPD = await tx.sppd.findUnique({
                where:{sppd_id : data.sppd_id}
            })

            if(!getSPPD){
                let newID
                const separator = "_"
                const dept = await tx.dept.findUnique({where:{dept_code: data.dept}})

                const [{id}] = await tx.$queryRawUnsafe(`
                    SELECT IFNULL(MAX(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(sppd_id, '${separator}', 1), '-', 1) AS unsigned)), 0) as id
                    from SPPD where 
                    SUBSTRING_INDEX(SUBSTRING_INDEX(sppd_id, '${separator}', 2), '${separator}', -1) = ? AND
                    SUBSTRING_INDEX(SUBSTRING_INDEX(sppd_id, '${separator}', -1), '-', -1) = year(now())`,
                dept?.initial) as {id: number}[]
                const lastID = Number(id) + 1
                newID = `${lastID}-SPPD${separator}${dept?.initial}${separator}STM${separator}${format(new Date(), "MM-yyyy")}`

                await tx.$queryRawUnsafe(`
                    INSERT INTO sppd (sppd_id,purpose,location,dept,start_date,end_date,duration,createdBy,createdAt) 
                    VALUES(?,?,?,?,?,?,?,?,now())`,
                    newID,data.purpose,data.location,data.dept,data.date[0],data.date[1],data.duration,data.createdBy)
                
                await tx.sppd_detail.createMany({
                    data: dataSPPDDetail.map(({payroll, description}, step) => ({
                        sppd_detail_id: uuid4(),
                        sppd_id: newID,
                        payroll, step, description
                    }))
                })

                return { message: "Data successfully saved" }
            }else{
                await tx.$queryRawUnsafe(`
                    UPDATE sppd SET purpose=?,location=?,dept=?,start_date=?,end_date=?,duration=? WHERE sppd_id=?`,
                    data.purpose,data.location,data.dept,data.date[0],data.date[1],data.duration,data.sppd_id)

                await tx.sppd_detail.deleteMany({
                    where : { sppd_id: data.sppd_id }
                })

                await tx.sppd_detail.createMany({
                    data: dataSPPDDetail.map(({payroll, description}, step) => ({
                        sppd_detail_id: uuid4(),
                        sppd_id: data.sppd_id,
                        payroll, step, description
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