import {json} from '@sveltejs/kit'
import { prisma } from '@lib/utils.js'

export async function GET({params}){
    const {id} = params
    const req = await prisma.profile.findUnique({
        where:{profile_id:id}
    })
    return json(req)
}

export async function DELETE({params}){
    try {
        const {id} = params
        await prisma.profile.delete({
            where:{profile_id:id}
        })
        return json({ message: "Data successfully deleted" });
    } catch (error) {
        
    }
}