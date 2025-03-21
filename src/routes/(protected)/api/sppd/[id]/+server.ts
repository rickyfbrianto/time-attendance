import { error, json } from "@sveltejs/kit";
import { prisma } from '@lib/utils.js'

export async function GET({params}){
    const {id} = params
    const req = await prisma.sppd.findUnique({
        select:{
            sppd_id: true,
            dept: true,
            start_date: true,
            end_date: true,
            duration:true,
            createdBy:true,
            createdAt:true,
            sppd_detail: {
                select: { 
                    payroll : true,
                    location : true,
                    description : true,
                },
                orderBy:{
                    sppd_detail_id: 'asc'
                }
            },
        },
        where:{sppd_id:id},
    })
    return json(req)
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