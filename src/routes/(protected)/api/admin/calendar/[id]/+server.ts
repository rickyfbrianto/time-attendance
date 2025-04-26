import {prisma, prismaErrorHandler} from '@lib/utils'
import { error, json } from '@sveltejs/kit'

export async function GET({params}){
    const id = params.id
    const req = await prisma.calendar.findUnique({
        where:{
            calendar_id: id
        }
    })
    return json(req)
}

export async function DELETE({params}){
    try {
        const id = params.id
        const req = await prisma.calendar.delete({
            where:{
                calendar_id: id
            }
        })
        return json({message:"Data successfully deleted"})
    } catch (err) {
        error(500, prismaErrorHandler(err))
    }
}

