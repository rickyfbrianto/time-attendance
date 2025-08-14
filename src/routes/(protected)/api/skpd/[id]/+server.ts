import { error, json } from "@sveltejs/kit";
import { prisma, prismaErrorHandler } from '@lib/utils.js'

export async function GET({ params }) {
    const { id } = params
    const req = await prisma.$queryRawUnsafe(`
        SELECT skpd.*, e.name, e.user_id_machine, e.position, e.location, sd.description, d.name as dept, 
        a.payroll as approve, a.name as approve_name, a.position as approve_position, a.signature as approve_signature FROM skpd
        LEFT JOIN employee e ON e.payroll = skpd.payroll
        LEFT JOIN employee a ON a.payroll = skpd.approve
        LEFT JOIN sppd ON sppd.sppd_id = skpd.sppd_id
        LEFT JOIN sppd_detail sd ON sd.sppd_id = skpd.sppd_id AND sd.payroll = skpd.payroll
        LEFT JOIN dept d ON d.dept_code = e.department
        WHERE skpd_id = ?`,
        id) as {}[]
    return json(req[0])
}

export async function DELETE({ params }) {
    try {
        const status = await prisma.$transaction(async tx => {
            const { id } = params
            const deleteSKPD = prisma.skpd.delete({
                where: { skpd_id: id }
            })

            const deleteAttendanceFromSKPD = tx.$executeRawUnsafe(`
                DELETE FROM attendance WHERE reference = ?`, id
            )

            const tempHasil = await Promise.all([deleteSKPD, deleteAttendanceFromSKPD])

            return { message: "Data successfully deleted" }
        })

        return json(status)
    } catch (err) {
        error(500, prismaErrorHandler(err))
    }
}