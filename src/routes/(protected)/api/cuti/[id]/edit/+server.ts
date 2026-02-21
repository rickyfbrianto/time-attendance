import { json, type RequestHandler } from "@sveltejs/kit";
import { prisma } from '@lib/utils.js'

export const GET: RequestHandler<{ id: string }> = async ({ params }) => {
    const {id} = params
    const req = await prisma.cuti.findUnique({
        where:{
            cuti_id:id,
            status: "Waiting",
        },
    })
    return json(req)
}