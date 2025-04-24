import { error, json } from "@sveltejs/kit";
import { prisma, prismaErrorHandler } from '@lib/utils.js'

export async function GET({params}){
    const {id} = params
    const req = await prisma.ijin.findUnique({
        where:{
            ijin_id:id,
            status: "Waiting",
        },
    })
    return json(req)
}