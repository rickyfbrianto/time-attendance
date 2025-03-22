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
            SELECT sppd_id, purpose, start_date, end_date, duration, e.name FROM SPPD
            LEFT JOIN employee as e ON e.payroll = SPPD.createdBy
            WHERE sppd_id like ? OR purpose like ? OR start_date like ? OR end_date like ? OR e.name like ?
            ORDER by ${sort} ${order} LIMIT ? OFFSET ?`,
            `%${search}%`,`%${search}%`,`%${search}%`,`%${search}%`,`%${search}%`, limit, offset)

        const totalItems = await tx.$queryRawUnsafe(`SELECT COUNT(*) as count FROM SPPD
            LEFT JOIN employee as e ON e.payroll = SPPD.createdBy
            WHERE sppd_id like ? OR purpose like ? OR start_date like ? OR end_date like ? OR e.name like ?`,
            `%${search}%`,`%${search}%`,`%${search}%`,`%${search}%`,`%${search}%`)
                    
        return {items, totalItems: Number(totalItems[0].count)}
    })

    return json(status)
}

export async function POST({ request,  }) {
    try {        
        const data = await request.json();
        const { isError, errorCount } = checkFieldKosong(data);
        if (isError) 
            throw new Error(`${errorCount} input masih kosong`)

        if(data.sppd_detail.every((val:any) => (!val.payroll.trim() || !val.description.trim() || !val.location.trim()))) 
            throw new Error("Detail masih kosong")

        const dataSPPDDetail = data.sppd_detail.map((val:any) => {
            return {payroll: val.payroll, location:val.location.trim(), description: val.description.trim()}
        })        
        
        const status = await prisma.$transaction(async tx =>{
            const getSPPD = await tx.sppd.findUnique({
                where:{sppd_id : data.sppd_id}
            })

            if(!getSPPD){
                let newID
                const dept = await tx.dept.findUnique({where:{dept_code: data.dept}})

                const tempID = await tx.$queryRawUnsafe(`
                SELECT sppd_id as id from sppd 
                    WHERE 
                    SUBSTRING_INDEX(SUBSTRING_INDEX(sppd_id, '-', 2), '-', -1) = '${dept?.name}' AND 
                    SUBSTRING_INDEX(SUBSTRING_INDEX(sppd_id, '-', 3), '-', -1) = year(now()) AND 
                    SUBSTRING_INDEX(SUBSTRING_INDEX(sppd_id, '-', 4), '-', -1) = month(now())
                ORDER by sppd_id desc limit 0,1`)
                if(tempID.length > 0){
                    newID = tempID[0].id.split('-')
                    const lastID = Number(newID[newID.length-1]) + 1
                    newID[newID.length-1] = lastID
                    newID = newID.join('-')
                    newID = newID.toUpperCase()
                }else{
                    newID = `SPPD-${dept?.name}-${format(new Date(), "yyyy-MM")}-1`
                }

                await tx.$queryRawUnsafe(`
                    INSERT INTO sppd (sppd_id,purpose,dept,start_date,end_date,duration,createdBy,createdAt) 
                    VALUES(?,?,?,?,?,?,?,now())`,
                    newID,data.purpose,data.dept,data.date[0],data.date[1],data.duration,data.createdBy)
                
                await tx.sppd_detail.createMany({
                    data: dataSPPDDetail.map(({payroll, location, description}:{payroll:string, location:string, description:string}) => ({
                        sppd_detail_id: uuid4(),
                        sppd_id: newID,
                        payroll, location, description
                    }))
                })

                return { message: "Data successfully saved" }
            }else{
                await tx.$queryRawUnsafe(`
                    UPDATE sppd SET purpose=?,dept=?,start_date=?,end_date=?,duration=? WHERE sppd_id=?`,
                    data.purpose,data.dept,data.date[0],data.date[1],data.duration,data.sppd_id)

                await tx.sppd_detail.deleteMany({
                    where : { sppd_id: data.sppd_id }
                })

                await tx.sppd_detail.createMany({
                    data: dataSPPDDetail.map(({payroll, location, description}:{payroll:string, location:string, description:string}) => ({
                        sppd_detail_id: uuid4(),
                        sppd_id: data.sppd_id,
                        payroll, location, description
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