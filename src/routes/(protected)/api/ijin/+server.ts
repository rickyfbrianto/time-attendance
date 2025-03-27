import { error, json } from "@sveltejs/kit";
import { checkFieldKosong, formatTanggal, isEmpty, prismaErrorHandler } from "@lib/utils";
import { prisma } from '@lib/utils.js'
import { format } from "date-fns";

export async function GET({url}){
    const page = Number(url.searchParams.get('_page')) || 1
    const limit = Number(url.searchParams.get('_limit')) || 10
    const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') ?? "date"
    const order = url.searchParams.get('_order') ?? "asc"
    const search = url.searchParams.get('_search') ?? ""
    
    const status = await prisma.$transaction(async (tx) => {     
        const items = await tx.$queryRawUnsafe(`
            SELECT i.*, e.name FROM ijin as i
            LEFT JOIN employee as e ON i.payroll = e.payroll
            WHERE ijin_id like ? 
            ORDER by ${sort} ${order} LIMIT ? OFFSET ?`,
            `%${search}%`, limit, offset)

        const totalItems = await tx.$queryRawUnsafe(`SELECT count(*) as count FROM ijin as i
            WHERE ijin_id like ?`, 
            `%${search}%`)
        return {items, totalItems: Number(totalItems[0].count)}
    })
    return json(status)
}

export async function POST({ request}) {
    try {        
        const data = await request.json();
        const { isError, errorCount } = checkFieldKosong(data);
        if (isError) 
            throw new Error(`${errorCount} input masih kosong`)
        
        const status = await prisma.$transaction(async tx =>{
            const getIjin = await tx.ijin.findUnique({
                where:{ijin_id : data.ijin_id}
            })

            if(!getIjin){
                let newID
                const dept = await tx.dept.findUnique({where:{dept_code: data.dept}})
                
                const tempID = await tx.$queryRawUnsafe(`
                    SELECT ijin_id as id from ijin 
                        WHERE 
                        SUBSTRING_INDEX(SUBSTRING_INDEX(ijin_id, '-', 2), '-', -1) = '${dept?.name}' AND 
                        SUBSTRING_INDEX(SUBSTRING_INDEX(ijin_id, '-', 3), '-', -1) = year(now()) AND 
                        SUBSTRING_INDEX(SUBSTRING_INDEX(ijin_id, '-', 4), '-', -1) = month(now())
                    ORDER by ijin_id desc limit 0,1`)
                    if(tempID.length > 0){
                        newID = tempID[0].id.split('-')
                        const lastID = Number(newID[newID.length-1]) + 1
                    newID[newID.length-1] = lastID
                    newID = newID.join('-')
                    newID = newID.toUpperCase()
                }else{
                    newID = `IJIN-${dept?.name}-${format(new Date(), "yyyy-MM")}-1`
                }
                
                await tx.$queryRawUnsafe(`
                    INSERT INTO Ijin (ijin_id,payroll,type,description,date,status,createdAt) VALUES(?,?,?,?,?,?,?,now())`,
                    newID,data.payroll,data.type,data.description,data.date,data.status)
                
                return { message: "Data successfully saved" }
            }else{
                await tx.$queryRawUnsafe(`
                    UPDATE ijin SET payroll=?,description=?,start_date=?,end_date=?,status=? WHERE ijin_id=?`,
                    data.payroll,data.description,data.date[0],data.date[1],data.status,data.ijin_id)

                return { message: "Data successfully updated" }
            }
        })

        return json(status);
    } catch (err:any) {
        console.log("err catch",err);
        error(500, err.message)
    }
}