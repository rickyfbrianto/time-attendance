import { error, json } from "@sveltejs/kit";
import { prisma, prismaErrorHandler } from '@lib/utils.js'

export async function GET({params}){
    const {id} = params
    const req = await prisma.attendance.findUnique({
        where:{attendance_id:id},
    })
    return json(req)
}

export async function DELETE({params}){
    try {
        const {id} = params
        const req = await prisma.attendance.delete({
            where:{attendance_id:id},
        })
        return json(req)
    } catch (err) {
        error(500, prismaErrorHandler(err))
    }
}