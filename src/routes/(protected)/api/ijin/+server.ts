import { error, json } from "@sveltejs/kit";
import { formatTanggal, formatTanggalISO, prismaErrorHandler } from "@lib/utils";
import { prisma } from '@lib/utils.js'
import { eachDayOfInterval, format, getDay, getYear } from "date-fns";
import { v4 as uuid4 } from "uuid";

export async function GET({url}){
    const page = Number(url.searchParams.get('_page')) || 1
    const limit = Number(url.searchParams.get('_limit')) || 10
    const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
    const sort = url.searchParams.get('_sort') ?? "date"
    const order = url.searchParams.get('_order') ?? "asc"
    const search = url.searchParams.get('_search') ?? ""
    
    const payroll = url.searchParams.get('payroll')
    
    const status = await prisma.$transaction(async (tx) => {     
        const items = await tx.$queryRawUnsafe(`
            SELECT i.*, e.name, approve.name as approval_name FROM ijin as i
            LEFT JOIN employee as e ON i.payroll = e.payroll
            LEFT JOIN employee as approve ON i.approval = approve.payroll
            WHERE e.payroll = ? AND (i.ijin_id like ?)
            ORDER by ${sort} ${order} LIMIT ? OFFSET ?`,
        payroll, `%${search}%`, limit, offset)

        const [{count}] = await tx.$queryRawUnsafe(`SELECT count(*) as count FROM ijin as i
            LEFT JOIN employee as e ON i.payroll = e.payroll
            LEFT JOIN employee as approve ON i.approval = approve.payroll
            WHERE e.payroll = ? AND (i.ijin_id like ?)`, 
        payroll, `%${search}%`) as {count:number}[]
        return {items, totalItems: Number(count)}
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
                const user = await tx.employee.findUnique({
                    select:{workhour: true},
                    where:{payroll:data.payroll}
                })
                
                const year = getYear(new Date())
                const month = 12
                const resCalendar = await prisma.$queryRawUnsafe(`
                    SELECT date FROM calendar WHERE YEAR(date) = ? AND month(date) <= ?
                    ORDER BY date asc`, year, month) as {date: string}[]

                const resIjin = await tx.$queryRawUnsafe(`SELECT date FROM ijin WHERE DATE(date) BETWEEN ? AND ?`,
                    data.date[0], data.date[1]) as {date: string}[]
                
                const daysInRange = eachDayOfInterval({ start: data.date[0], end: data.date[1] })
                const dayFree = user?.workhour == 7 ? [0] : [0, 6]

                const temp = daysInRange.filter(v => {
                    return !resCalendar.some(cal => formatTanggal(format(v, "yyyy-MM-dd"), "date") == formatTanggal(format(cal.date, "yyyy-MM-dd"), "date")) 
                    && !resIjin.some(cal => formatTanggal(format(v, "yyyy-MM-dd"), "date") == formatTanggal(format(cal.date, "yyyy-MM-dd"), "date"))
                    && !dayFree.includes(getDay(v))
                }).map(v => formatTanggal(format(v, "yyyy-MM-dd"), "date"))
                
                await tx.ijin.createMany({
                    data: [...temp.map((date) => ({
                        ijin_id: uuid4(),
                        payroll: data.payroll,
                        type: data.type,
                        description: data.description,
                        date: formatTanggalISO(date),
                        status: data.status,
                        approval: data.approval,
                        createdAt: formatTanggalISO(new Date())
                    }))]
                })

                return { message: "Data successfully saved" }
            }else{
                const updateIjin = await tx.$executeRawUnsafe(`
                    UPDATE ijin SET date=?,description=?,type=? WHERE ijin_id=?`,
                    data.date,data.description,data.type,data.ijin_id)

                if(!updateIjin) throw new Error("Cant update SPL, because data is changed")
                    
                return { message: "Data successfully updated" }
            }
        })

        return json(status);
    } catch (err:any) {
        error(500, prismaErrorHandler(err))
    }
}