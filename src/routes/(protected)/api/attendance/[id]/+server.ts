import { error, json } from "@sveltejs/kit";
import { prisma, prismaErrorHandler } from '@lib/utils.js'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function GET({ params }) {
    const { id } = params
    const req = await prisma.attendance.findUnique({
        where: { attendance_id: id },
    })
    return json(req)
}

export async function DELETE({ params }) {
    try {
        const { id } = params
        const filePath = path.resolve(process.env.ATTACH_ATTANDANCE + `/${id}.jpg`)
        const fileExist = existsSync(filePath)

        const deleteAttendance = await prisma.attendance.delete({
            where: { attendance_id: id },
        })
        if (deleteAttendance && fileExist) {
            await unlink(filePath);
        }
        return json({ message: "Attendance successfully deleted" })
    } catch (err) {
        error(500, prismaErrorHandler(err))
    }
}