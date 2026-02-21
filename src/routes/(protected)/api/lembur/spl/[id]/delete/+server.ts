import { error, json, type RequestHandler } from "@sveltejs/kit";
import { pecahArray, prisma, prismaErrorHandler } from '@lib/utils.js'

export const DELETE: RequestHandler<{ id: string }> = async ({ params, locals }) => {
    try {
        const { id } = params
        const { userProfile } = locals
        if (!pecahArray(userProfile.access_spl, "D")) throw new Error("Cant delete SPL, because you have no authorization")
        await prisma.spl.delete({
            where: {
                spl_id: id,
                status1: "Waiting",
            }
        })
        return json({ message: "Data successfully deleted" })
    } catch (err) {
        error(500, prismaErrorHandler(err))
    }
}