import { error, json } from "@sveltejs/kit";
import { checkFieldKosong, formatTanggal, formatTanggalISO, } from "@lib/utils";
import { prisma } from '@lib/utils.js'
import { eachDayOfInterval, format, formatISO, getDay, getYear } from "date-fns";
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
            SELECT c.*, e.name FROM cuti as c
            LEFT JOIN employee as e ON c.payroll = e.payroll
            WHERE e.payroll like ? AND (cuti_id like ?)
            ORDER by ${sort} ${order} LIMIT ? OFFSET ?`,
            `%${search}%`,`%${search}%`, limit, offset)

        const totalItems = await tx.$queryRawUnsafe(`SELECT count(*) as count FROM cuti as c
            WHERE cuti_id like ?`, 
            `%${search}%`)
        return {items, totalItems: Number(totalItems[0].count)}
    })
    return json(status)
}

export async function POST({ request }) {
    try {        
        const data = await request.json();
        
        const status = await prisma.$transaction(async tx =>{
            const getCuti = await tx.cuti.findUnique({
                where:{cuti_id : data.cuti_id}
            })
            
            if(!getCuti){
                const user = await tx.employee.findUnique({
                    select:{workhour: true},
                    where:{payroll:data.payroll}
                })
                
                const year = getYear(new Date())
                const month = 12
                const resCalendar = await prisma.$queryRawUnsafe(`
                    SELECT date FROM calendar WHERE YEAR(date) = ? AND month(date) <= ?
                    ORDER BY date asc`, year, month) as {date: string}[]

                const daysInRange = eachDayOfInterval({ start: data.date[0], end: data.date[1] })
                const dayFree = user?.workhour == 7 ? [0] : [0, 6]
                
                const temp = daysInRange.filter(v => {
                    return !resCalendar.some(cal => formatTanggal(format(v, "yyyy-MM-dd"), false) == formatTanggal(format(cal.date, "yyyy-MM-dd"), false)) && !dayFree.includes(getDay(v))
                }).map(v => formatTanggal(format(v, "yyyy-MM-dd"), false))

                await tx.cuti.createMany({
                    data: [...temp.map((date) => ({
                        cuti_id: uuid4(),
                        payroll: data.payroll,
                        type: data.type,
                        description: data.description,
                        date: formatTanggalISO(date),
                        year: getYear(data.date[0]),
                        status: data.status,
                        createdAt: formatTanggalISO(new Date())
                    }))]
                })
                
                // let newID
                // const [{name}] = await tx.$queryRawUnsafe(`
                //     SELECT d.name FROM employee e LEFT JOIN dept d ON d.dept_code = e.department 
                //     WHERE payroll = ?`, data.payroll) as {name:string}[]

                // const [{id}] = await tx.$queryRawUnsafe(`
                //     SELECT cuti_id as id from cuti 
                //     WHERE 
                //     SUBSTRING_INDEX(SUBSTRING_INDEX(cuti_id, '-', 2), '-', -1) = '${name}' AND 
                //     SUBSTRING_INDEX(SUBSTRING_INDEX(cuti_id, '-', 3), '-', -1) = year(now()) AND 
                //     SUBSTRING_INDEX(SUBSTRING_INDEX(cuti_id, '-', 4), '-', -1) = month(now())
                //     ORDER by cuti_id desc limit 0,1`) as {id:string}[]

                // if(id){
                //     newID = id.split('-')
                // const lastID = Number(newID[newID.length-1]) + 1
                // newID[newID.length-1] = lastID
                // newID = newID.join('-')
                // newID = newID.toUpperCase()
                // }else{
                //     newID = `IJIN-${name}-${format(new Date(), "yyyy-MM")}-1`
                // }
                
                // await tx.$queryRawUnsafe(`
                //     INSERT INTO Ijin (ijin_id,payroll,type,description,start_date,end_date,status,createdAt) VALUES(?,?,?,?,?,?,?,now())`,
                //     newID,data.payroll,data.type,data.description,data.date[0],data.date[1],data.status)
                
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