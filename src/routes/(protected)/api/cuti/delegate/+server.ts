import { error, json } from "@sveltejs/kit";
import { prisma } from '@lib/utils.js'

export async function POST({ request }) {
    try {        
        const data = await request.json();
        
        const status = await prisma.$transaction(async tx =>{
            await tx.cuti.update({
                data:{ approval: data.user_delegate },
                where: { cuti_id: data.cuti_id }
            })

            return {message:"Cuti successfully delegated"}
        })

        return json(status);
    } catch (err:any) {
        console.log("err catch",err);
        error(500, err.message)
    }
}