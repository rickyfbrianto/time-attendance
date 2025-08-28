import { error, json } from "@sveltejs/kit";
import { prisma, prismaErrorHandler } from '@lib/utils.js'

export async function POST({ params, request, locals }) {
    try {
        const { id } = params
        const data = await request.json();
        const { user } = locals

        const status = await prisma.$transaction(async tx => {
            if (user.user_type !== 'HR') throw new Error('Anda tidak memiliki akses untuk acknowledge SPL ini, silahkan perbarui halaman')
            await tx.spl.update({
                data: { acknowledgeBy: data.acknowledgeBy },
                where: {
                    spl_id: id,
                    status1: "Approved",
                }
            })

            return { message: `SPL telah diketahui HRD` }
        })

        return json(status);
    } catch (err: any) {
        error(500, prismaErrorHandler(err))
    }
}