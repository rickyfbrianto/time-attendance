import { pecahArray, prisma, prismaErrorHandler } from '@lib/utils'
import { error, json, type RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler<{ id: string }> = async ({ params }) => {
    const {id} = params
    const req = await prisma.calendar.findUnique({
        where: {
            calendar_id: id
        }
    })
    return json(req)
}

export const DELETE: RequestHandler<{ id: string }> = async ({ params, locals }) => {
    try {
        const {id} = params
        const { userProfile } = locals
        if (!pecahArray(userProfile.access_calendar, "D")) throw new Error("Cant delete Calendar, because you have no authorization")
        await prisma.calendar.delete({
            where: {
                calendar_id: id
            }
        })
        return json({ message: "Data successfully deleted" })
    } catch (err) {
        error(500, prismaErrorHandler(err))
    }
}

