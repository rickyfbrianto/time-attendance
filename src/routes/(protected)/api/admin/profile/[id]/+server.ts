import { error, json, type RequestHandler } from '@sveltejs/kit'
import { pecahArray, prisma, prismaErrorHandler } from '@lib/utils.js'

export const GET: RequestHandler<{ id: string }> = async ({ params }) => {
    const { id } = params
    const req = await prisma.profile.findUnique({
        where: { profile_id: id }
    })
    return json(req)
}

export const DELETE: RequestHandler<{ id: string }> = async ({ params, locals }) => {
    try {
        const { id } = params
        const { userProfile } = locals
        if (!pecahArray(userProfile.access_profile, "D")) throw new Error("Cant delete Profile, because you have no authorization")
        await prisma.profile.update({
            data: {
                status: "Nonaktif"
            },
            where: { profile_id: id }
        })
        return json({ message: "Profile successfully deleted (Non Active)" });
    } catch (err) {
        error(500, prismaErrorHandler(err))
    }
}