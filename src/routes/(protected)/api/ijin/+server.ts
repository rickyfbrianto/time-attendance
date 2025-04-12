import { error, json } from "@sveltejs/kit";
import { formatTanggal, formatTanggalISO, prismaErrorHandler } from "@lib/utils";
import { prisma } from '@lib/utils.js'
import { differenceInDays, eachDayOfInterval, format, getDay, getYear } from "date-fns";
import { v4 as uuid4 } from "uuid";

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
            WHERE i.ijin_id like ? 
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
        
        const status = await prisma.$transaction(async tx =>{
            const getIjin = await tx.ijin.findUnique({
                where:{ijin_id : data.ijin_id}
            })

            if(!getIjin){
                let newID
                const separator = "_"

                const user = await tx.employee.findUnique({
                    select:{workhour: true},
                    where:{payroll:data.payroll}
                })
                
                const year = getYear(new Date())
                const month = 12
                const resCalendar = await prisma.$queryRawUnsafe(`
                    SELECT date FROM calendar WHERE YEAR(date) = ? AND month(date) <= ?
                    ORDER BY date asc`, year, month) as {date: string}[]
                
                const daysInRange = eachDayOfInterval({ start: data.date_range[0], end: data.date_range[1] })
                const dayFree = user?.workhour == 7 ? [0] : [0, 6]

                const temp = daysInRange.filter(v => {
                    return !resCalendar.some(cal => formatTanggal(format(v, "yyyy-MM-dd"), false) == formatTanggal(format(cal.date, "yyyy-MM-dd"), false)) 
                    && !dayFree.includes(getDay(v))
                }).map(v => formatTanggal(format(v, "yyyy-MM-dd"), false))
                
                await tx.ijin.createMany({
                    data: [...temp.map((date) => ({
                        ijin_id: uuid4(),
                        payroll: data.payroll,
                        type: data.type,
                        description: data.description,
                        date: formatTanggalISO(date),
                        status: data.status,
                        createdAt: formatTanggalISO(new Date())
                    }))]
                })
                
                // const dept = await tx.dept.findUnique({where:{dept_code: data.dept}})
                
                // eachDayOfInterval(data.date_range[0], data.date_range[1]).map(async date => {                
                //     const [{id}] = await tx.$queryRawUnsafe(`
                //         SELECT 
                //         IFNULL(MAX(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(ijin_id, '${separator}', 1), '-', 1) AS unsigned)), 0) as id
                //         from ijin where 
                //         SUBSTRING_INDEX(SUBSTRING_INDEX(ijin_id, '_', 2), '_', -1) = ? AND
                //         SUBSTRING_INDEX(SUBSTRING_INDEX(ijin_id, '_', -1), '${separator}', -1) = year(now())`,
                //     dept?.initial) as {id: number}[]
                    
                //     const lastID = Number(id) + 1
                //     newID = `${lastID}-IJIN${separator}${dept?.initial}${separator}STM${separator}${format(new Date(), "MM-yyyy")}`
                    
                //     await tx.$queryRawUnsafe(`INSERT INTO Ijin (ijin_id,payroll,type,description,date,status,createdAt) 
                //         VALUES(?,?,?,?,?,?,now())`,
                //     newID,data.payroll,data.type,data.description, date,data.status)
                // })

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