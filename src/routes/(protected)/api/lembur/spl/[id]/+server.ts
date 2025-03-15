import { error, json } from "@sveltejs/kit";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET({params}){
    const {id} = params
    const req = await prisma.spl.findUnique({
        select:{
            spl_id: true,
            payroll: true,
            est_start: true,
            est_end: true,
            spl_detail: {
                select: { 
                    description : true,
                },
                orderBy:{
                    step: 'asc'
                }
            },
        },
        where:{spl_id:id},
    })
    return json(req)
}