import { error, json } from "@sveltejs/kit";
import { prisma } from '@lib/utils.js'

export async function GET({params}){
    const {id} = params
    const req = await prisma.cuti.findUnique({
        where:{cuti_id:id},
    })
    return json(req)
}

export async function DELETE({params}){
    try {
        const {id} = params
        const req = await prisma.cuti.delete({
            where:{
                cuti_id:id
            }
        })
        return json({message:"Data successfully deleted"})
    } catch (err) {
        
    }
}