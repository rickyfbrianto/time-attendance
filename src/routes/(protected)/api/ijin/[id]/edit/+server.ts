import { json, type RequestHandler } from "@sveltejs/kit";
import { prisma } from '@lib/utils.js'

export const GET: RequestHandler<{ id: string }> = async ({ params }) => {
    const { id } = params
    const req = await prisma.ijin.findUnique({
        where: {
            ijin_id: id,
            status: "Waiting",
        },
    })
    return json(req)
}