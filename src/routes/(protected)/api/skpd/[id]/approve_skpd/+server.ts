import { error, json, type RequestHandler } from "@sveltejs/kit";
import { prisma, prismaErrorHandler } from '@lib/utils.js'

export const POST: RequestHandler<{ id: string }> = async ({ params, locals }) => {
    try {
        const { id } = params
        const { payroll } = locals.user
        const status = await prisma.$transaction(async tx => {
            await prisma.skpd.update({
                data: {
                    status: "APPROVED"
                },
                where: {
                    skpd_id: id,
                    approve: payroll
                }
            })

            return { message: "SKPD berhasil di approve" }
        })

        return json(status)
    } catch (err) {
        error(500, prismaErrorHandler(err))
    }
}