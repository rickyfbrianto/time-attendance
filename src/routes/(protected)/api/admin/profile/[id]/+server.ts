import {json} from '@sveltejs/kit'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET({params}){
    const {id} = await params
    const req = await prisma.profile.findUnique({
        where:{profile_id:id}
    })
    return json(req)
}

export async function DELETE({params}){
    try {
        const {id} = await params
        await prisma.profile.delete({
            where:{profile_id:id}
        })
        return json({ message: "Data successfully deleted" });
    } catch (error) {
        
    }
}