import { error, json } from "@sveltejs/kit";
import { checkFieldKosong, formatTanggal, isEmpty, prismaErrorHandler } from "@lib/utils";
import { v4 as uuid4 } from "uuid";
import { prisma } from '@lib/utils.js'
import { format } from "date-fns";

export async function GET({url}){
    const page = Number(url.searchParams.get('_page')) || 1
    const limit = Number(url.searchParams.get('_limit')) || 10
    const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') ?? "real_start"
    const order = url.searchParams.get('_order') ?? "asc"
    const search = url.searchParams.get('_search') ?? ""
    
    const status = await prisma.$transaction(async (tx) => {     
        const items = await tx.$queryRawUnsafe(`
            SELECT skpd_id, s.sppd_id, sd.location, sd.description, e.name, real_start, real_end FROM SKPD as s
            LEFT JOIN employee as e ON e.payroll = s.payroll
            LEFT JOIN sppd_detail as sd ON s.payroll = sd.payroll AND s.sppd_id = sd.sppd_id
            WHERE skpd_id like ? OR s.sppd_id like ? OR e.name like ? OR real_start like ? OR real_end like ?
            ORDER by ${sort} ${order} LIMIT ? OFFSET ?`,
            `%${search}%`,`%${search}%`,`%${search}%`,`%${search}%`,`%${search}%`, limit, offset)

        const totalItems = await tx.$queryRawUnsafe(`SELECT count(*) as count FROM SKPD as s
            LEFT JOIN employee as e ON e.payroll = s.payroll
            LEFT JOIN sppd_detail as sd ON s.payroll = sd.payroll AND s.sppd_id = sd.sppd_id
            WHERE skpd_id like ? OR s.sppd_id like ? OR e.name like ? OR real_start like ? OR real_end like ?`, 
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
        
        const status = await prisma.$transaction(async tx =>{
            const getSKPD = await tx.skpd.findUnique({
                where:{skpd_id : data.skpd_id}
            })

            if(!getSKPD){
                let newID
                const dept = data.sppd_id.split('-')[1]

                const tempID = await tx.$queryRawUnsafe(`
                SELECT skpd_id as id from SKPD 
                    WHERE 
                    SUBSTRING_INDEX(SUBSTRING_INDEX(skpd_id, '-', 2), '-', -1) = '${dept}' AND 
                    SUBSTRING_INDEX(SUBSTRING_INDEX(skpd_id, '-', 3), '-', -1) = year(now()) AND 
                    SUBSTRING_INDEX(SUBSTRING_INDEX(skpd_id, '-', 4), '-', -1) = month(now())
                ORDER by skpd_id desc limit 0,1`)
                if(tempID.length > 0){
                    newID = tempID[0].id.split('-')
                    const lastID = Number(newID[newID.length-1]) + 1
                    newID[newID.length-1] = lastID
                    newID = newID.join('-')
                    newID = newID.toUpperCase()
                }else{
                    newID = `SKPD-${dept}-${format(new Date(), "yyyy-MM")}-1`
                }

                await tx.$queryRawUnsafe(`
                    INSERT INTO SKPD (skpd_id,sppd_id,payroll,real_start,real_end,status,createdBy,createdAt) 
                    VALUES(?,?,?,?,?,?,?,now())`,
                    newID,data.sppd_id,data.payroll,data.date[0],data.date[1],data.status,data.createdBy)
                
                return { message: "Data successfully saved" }
            }else{
                await tx.$queryRawUnsafe(`
                    UPDATE SKPD SET sppd_id=?,payroll=?,real_start=?,real_end=?,status=? WHERE skpd_id=?`,
                    data.sppd_id,data.payroll,data.date[0],data.date[1],data.status,data.skpd_id)

                return { message: "Data successfully updated" }
            }
        })

        return json(status);
    } catch (err:any) {
        console.log("err catch",err);
        error(500, err.message)
    }
}