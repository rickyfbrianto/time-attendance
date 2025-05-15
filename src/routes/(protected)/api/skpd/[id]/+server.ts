import { error, json } from "@sveltejs/kit";
import { prisma, prismaErrorHandler } from '@lib/utils.js'

export async function GET({params}){
    const {id} = params
    const req = await prisma.$queryRawUnsafe(`
        SELECT skpd.*, e.name, e.position, sppd.location, sd.description, d.name as dept FROM skpd
        LEFT JOIN employee e ON e.payroll = skpd.payroll
        LEFT JOIN sppd ON sppd.sppd_id = skpd.sppd_id
        LEFT JOIN sppd_detail sd ON sd.sppd_id = skpd.sppd_id AND sd.payroll = skpd.payroll
        LEFT JOIN dept d ON d.dept_code = e.department
        WHERE skpd_id = ?`,
    id) as {}[]
    return json(req[0])
}

export async function DELETE({params}){
    try {
        const {id} = params
        await prisma.skpd.delete({
            where:{skpd_id:id}
        })
        return json({message:"Data successfully deleted"})
    } catch (err) {
        error(500, prismaErrorHandler(err))
    }
}