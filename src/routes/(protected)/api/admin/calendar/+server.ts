import { error, json, type RequestHandler } from '@sveltejs/kit'
import { prisma, prismaErrorHandler, pecahArray } from '@lib/utils'
import { v4 } from 'uuid'

export const GET: RequestHandler = async ({ url }) => {
    try {
        const page = Number(url.searchParams.get('_page')) || 1
        const limit = Number(url.searchParams.get('_limit')) || 10
        const offset = Number(url.searchParams.get('_offset')) || (page - 1) * page
        const sort = url.searchParams.get('_sort') ?? "date"
        const order = url.searchParams.get('_order') ?? "asc"
        const search = url.searchParams.get('_search') ?? ""

        const year = url.searchParams.get('year')

        const status = await prisma.$transaction(async (tx) => {
            const items = await tx.$queryRawUnsafe(`
                SELECT c.* FROM calendar as c
                WHERE YEAR(date) = ? AND (description like ? OR type like ? OR date like ?)
                ORDER by ${sort} ${order}
                LIMIT ? OFFSET ?`,
                year, `%${search}%`, `%${search}%`, `%${search}%`, limit, offset)

            const [{ count }] = await tx.$queryRawUnsafe(`SELECT COUNT(*) as count FROM calendar as c
                WHERE YEAR(date) = ? AND (description like ? OR type like ? OR date like ?)`,
                year, `%${search}%`, `%${search}%`, `%${search}%`) as { count: number }[]

            return { items, totalItems: Number(count) }
        })

        return json(status)
    } catch (err: any) {
        console.log(err.message)
        error(500, err.messsage)
    }
}

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        const data = await request.json()
        const { userProfile } = locals

        const status = await prisma.$transaction(async tx => {
            const getCalendar = await prisma.calendar.findUnique({
                where: { calendar_id: data.calendar_id }
            })

            if (!getCalendar) {
                if (!pecahArray(userProfile.access_calendar, "C")) throw new Error("Cant insert Calendar, because you have no authorization")
                await tx.$executeRawUnsafe(`
                    INSERT INTO calendar (calendar_id, description, type, date, createdBy, createdAt) VALUES (?,?,?,?,?,now())`,
                    v4(), data.description, data.type, data.date, data.createdBy)
                return { message: "Data successfully saved" }
            } else {
                if (!pecahArray(userProfile.access_calendar, "U")) throw new Error("Cant update Calendar, because you have no authorization")
                await tx.$executeRawUnsafe(`
                    UPDATE calendar SET description=?, type=?, date=? WHERE calendar_id=?`,
                    data.description, data.type, data.date, data.calendar_id)

                return { message: "Data successfully updated" }
            }
        })

        return json(status)
    } catch (err: any) {
        error(500, prismaErrorHandler(err))
    }
}