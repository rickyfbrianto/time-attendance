import {error, json} from '@sveltejs/kit'
import {prisma, prismaErrorHandler } from '@lib/utils'
import { v4 } from 'uuid'

export async function GET({url}){
    try {
        const page = Number(url.searchParams.get('_page')) || 1
        const limit = Number(url.searchParams.get('_limit')) || 10
        const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
        const sort = url.searchParams.get('_sort') ?? "date"
        const order = url.searchParams.get('_order') ?? "asc"
        const search = url.searchParams.get('_search') ?? ""

        const year = url.searchParams.get('year')

        let where = "WHERE 1=1 " + (search ? ` AND (dept_code like '%${search}%' OR name like '%${search}%' OR status like '%${search}%')` :"")
        
        const status = await prisma.$transaction(async (tx) => {
            const items = await tx.$queryRawUnsafe(`
                SELECT * FROM calendar 
                WHERE YEAR(date) = ? AND (description like ? OR type like ? OR date like ?)
                ORDER by ${sort} ${order}
                LIMIT ? OFFSET ?`,
                year, `%${search}%`,`%${search}%`,`%${search}%`, limit, offset)

            const totalItems = await tx.$queryRawUnsafe(`SELECT COUNT(*) as count FROM calendar 
                WHERE description like ? OR type like ? OR date like ?`,
                `%${search}%`,`%${search}%`,`%${search}%`)

            return {items, totalItems: Number( totalItems[0].count)}
        })
        
        return json(status)
    } catch (err: any) {
        console.log(err.message)
        error(500, err.messsage)        
    }
}

export async function POST({request}){
    try {
        const data = await request.json()

        const status = await prisma.$transaction(async tx => {
            const getCalendar = await prisma.calendar.findUnique({
                where:{calendar_id: data.calendar_id}
            })

            if(!getCalendar){
                await tx.$executeRawUnsafe(`
                    INSERT INTO calendar (calendar_id, description, type, date) VALUES (?,?,?,?)`,
                    v4(),data.description, data.type, data.date)
                
                return {message:"Data successfully saved"}
            }else{
                await tx.$executeRawUnsafe(`
                    UPDATE calendar SET description=?, type=?, date=? WHERE calendar_id=?`,
                    data.description, data.type, data.date, data.calendar_id)

                return {message:"Data successfully updated"}
            }
        })

        return json(status)
    } catch (err: any) {
        console.log(err.message)
        error(500, err.message)
    }
}