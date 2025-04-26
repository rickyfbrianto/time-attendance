import { error, json } from "@sveltejs/kit";
import { prisma } from '@lib/utils.js'

export async function GET({params}){
    const {id} = params
    const req = await prisma.cuti.findUnique({
        where:{
            cuti_id:id,
            status: "Waiting",
        },
    })
    return json(req)
}