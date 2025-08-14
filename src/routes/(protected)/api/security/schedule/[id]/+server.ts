import { json } from "@sveltejs/kit";
import { prisma } from '@lib/utils.js'

export async function GET({ params }) {
    const { id } = params
    const req = await prisma.security.findUnique({
        where: {
            id,
        },
    })
    return json(req)
}