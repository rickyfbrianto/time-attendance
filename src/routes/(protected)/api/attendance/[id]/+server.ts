import { error, json } from "@sveltejs/kit";
import { prisma, prismaErrorHandler } from '@lib/utils.js'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function GET({params}){
    const {id} = params
    const req = await prisma.attendance.findUnique({
        where:{attendance_id:id},
    })
    // const req = await prisma.$queryRawUnsafe(
    //     `SELECT * FROM attendance WHERE attendance_id = ?`, id)
    return json(req)
}

export async function DELETE({params}){
    try {
        const {id} = params
        const filePath = path.resolve(process.env.ATTACH_ATTANDANCE + `/${id}.jpg`)
        const fileExist = existsSync(filePath)
        
        await prisma.attendance.delete({
            where:{attendance_id:id},
        })
        if(fileExist){
            await unlink(filePath);
        }
        return json({message:"Data successfully deleted"})
    } catch (err) {
        error(500, prismaErrorHandler(err))
    }
}