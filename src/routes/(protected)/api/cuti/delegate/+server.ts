import { error, json } from "@sveltejs/kit";
import { prisma, prismaErrorHandler } from '@lib/utils.js'

export async function POST({ request }) {
    try {        
        const data = await request.json();
        
        const status = await prisma.$transaction(async tx =>{
            await tx.cuti.update({
                data:{ approval: data.user_delegate },
                where: { 
                    cuti_id: data.cuti_id,
                    status: "Waiting",
                    approval: data.approval
                }
            })

            return {message:"Cuti successfully delegated"}
        })

        return json(status);
    } catch (err:any) {
        error(500, prismaErrorHandler(err))
    }
}