import { error, json, type RequestHandler } from "@sveltejs/kit";
import { encryptData, prisma, prismaErrorHandler } from '@lib/utils.js'

export const POST: RequestHandler = async ({ request }) => {
    try {        
        const data = await request.json();
        
        const status = await prisma.$transaction(async tx =>{
            await tx.employee.update({
                data:{ password: encryptData(data.password, import.meta.env.VITE_KEY) },
                where: { 
                    payroll: data.payroll,
                }
            })

            return {message:`Password successfully changed`}
        })

        return json(status);
    } catch (err:any) {
        error(500, prismaErrorHandler(err))
    }
}