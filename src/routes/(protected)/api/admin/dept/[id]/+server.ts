import {prisma} from '@lib/utils'
import { json, type RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler<{ id: string }> = async ({ params }) => {
    const {id} = params
    const req = await prisma.dept.findUnique({
        where:{
            dept_id: id
        }
    })
    return json(req)
}