import {error, json} from '@sveltejs/kit'
import { prisma, prismaErrorHandler } from '@lib/utils.js'

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
        await prisma.profile.update({
            data:{
                status: "Nonaktif"
            },
            where:{profile_id:id}
        })
        return json({ message: "Profile successfully deleted" });
    } catch (err) {
        error(500, prismaErrorHandler(err))
    }
}