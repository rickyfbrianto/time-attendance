import { error, json, type RequestHandler } from '@sveltejs/kit'
import { pecahArray, prisma, prismaErrorHandler } from '@lib/utils.js'

export const GET: RequestHandler<{ id: string }> = async ({ params }) => {
    const { id } = params
    const req = await prisma.employee.findUnique({
        where: { payroll: id },
        omit: {
            password: true
        }
    })
    return json(req)
}

export const DELETE: RequestHandler<{ id: string }> = async ({ params, locals }) => {
    try {
        const { id } = params
        const { userProfile } = locals
        if (!pecahArray(userProfile.access_user, "D")) throw new Error("Cant delete User, because you have no authorization")
        await prisma.employee.update({
            data: {
                status: "Nonaktif"
            },
            where: { payroll: id }
        })
        return json({ message: "Data successfully deleted" });
    } catch (err) {
        error(500, prismaErrorHandler(err))
    }
}