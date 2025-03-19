import { json } from "@sveltejs/kit";
import { prisma } from '@lib/utils.js'

export async function GET({params}){
    const {id} = params
    const req = await prisma.attendance.findUnique({
        where:{attendance_id:id},
    })
    return json(req)
}

export async function DELETE({params}){
    const {id} = params
    const req = await prisma.attendance.delete({
        where:{attendance_id:id},
    })
    return json(req)
}