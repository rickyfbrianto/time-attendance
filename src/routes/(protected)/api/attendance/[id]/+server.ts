import { error, json } from "@sveltejs/kit";
import { pecahArray, prisma, prismaErrorHandler } from '@lib/utils.js'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function GET({ params }) {
    const { id } = params
    const req = await prisma.attendance.findFirst({
        where: { attendance_id: id },
        select: {
            attendance_id: true,
            user_id_machine: true,
            check_in: true,
            check_out: true,
            check_in2: true,
            check_out2: true,
            type: true,
            ijin_info: true,
            description: true,
            attachment: true,
            reference: true,
            createdBy: true,
            createdAt: true
        }
    })
    return json(req)
}

export async function DELETE({ params, locals }) {
    try {
        const { id } = params
        const { userProfile } = locals
        const filePath = path.resolve(process.env.ATTACH_ATTANDANCE + `/${id}.jpg`)
        const fileExist = existsSync(filePath)

        if (!pecahArray(userProfile.access_attendance, "D")) throw new Error("Cant delete Attendance, because you have no authorization")

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