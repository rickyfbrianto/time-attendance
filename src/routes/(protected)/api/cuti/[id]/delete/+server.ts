import { error, json, type RequestHandler } from "@sveltejs/kit";
import { pecahArray, prisma, prismaErrorHandler } from '@lib/utils.js'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export const DELETE: RequestHandler<{ id: string }> = async ({ params, locals }) => {
    try {
        const { id } = params
        const { userProfile } = locals

        if (!pecahArray(userProfile.access_cuti, "D")) throw new Error("Tidak dapat menghapus cuti, anda tidak memiliki akses")

        const [getCuti] = await prisma.$queryRawUnsafe(`
            SELECT c.attachment, c.cuti_group_id,
                (SELECT CAST(COUNT(cuti_id) as UNSIGNED) 
                FROM cuti WHERE cuti_group_id = c.cuti_group_id) AS jumlah
            FROM cuti c
            WHERE c.cuti_id = ?`, id) as { attachment: string, cuti_group_id: string, jumlah: number }[]

        const filePath = path.resolve(process.env.ATTACH_CUTI + getCuti.attachment)
        const fileExist = existsSync(filePath)


        const deleteCuti = await prisma.cuti.delete({
            where: {
                cuti_id: id,
                status: "Waiting",
            }
        })

        if (deleteCuti && fileExist && getCuti.jumlah == 1) {
            await unlink(filePath);
        }

        return json({ message: "Data successfully deleted" })
    } catch (err) {
        error(500, prismaErrorHandler(err))
    }
}