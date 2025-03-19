import {prisma} from '@lib/utils'
import { json } from '@sveltejs/kit'

export async function GET({params}){
    const id = params.id
    const req = await prisma.dept.findUnique({
        where:{
            dept_id: id
        }
    })
    return json(req)
}