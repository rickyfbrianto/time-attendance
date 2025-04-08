import { error, json } from "@sveltejs/kit";
import { prisma } from '@lib/utils.js'

export async function GET({params}){
    const {id} = params
    // const req = await prisma.sppd.findUnique({
    //     select:{
    //         sppd_id: true,
    //         purpose: true,
    //         dept: true,
    //         start_date: true,
    //         end_date: true,
    //         duration:true,
    //         createdBy:true,
    //         createdAt:true,
    //         sppd_detail: {
    //             select: { 
    //                 payroll : true,
    //                 location : true,
    //                 description : true,
    //             },
    //             orderBy:{
    //                 sppd_detail_id: 'asc'
    //             }
    //         },
    //     },
    //     where:{sppd_id:id},
    // })

    const req = await prisma.$queryRawUnsafe(`
        SELECT s.*, e.name, d.name as dept FROM sppd as s
        LEFT JOIN sppd_detail as sd ON sd.sppd_id = s.sppd_id AND sd.payroll = s.payroll
        LEFT JOIN dept d ON d.dept_code = e.department
        LEFT JOIN employee e ON e.payroll = skpd.payroll
        LEFT JOIN sppd_detail sd ON sd.sppd_id = skpd.sppd_id AND sd.payroll = skpd.payroll
        WHERE skpd_id = ?`,
    id) as {}[]
    
    return json(req[0])
}

export async function DELETE({params}){
    try {
        const {id} = params
        const req = await prisma.spl.delete({
            where:{
                spl_id:id
            }
        })
        return json({message:"Data successfully deleted"})
    } catch (err) {
        
    }
}