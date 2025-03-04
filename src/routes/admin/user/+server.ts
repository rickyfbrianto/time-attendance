import {error, json} from '@sveltejs/kit'
import { PrismaClient } from '@prisma/client'
import { checkFieldKosong, prismaErrorHandler } from '@lib/utils'

const prisma = new PrismaClient()



export async function GET() {
    const req = await prisma.employee.findMany({
        select:{
            payroll:true,
            profile_id:true,
            card_no:true,
            name:true,
            department:true
        }
    })
    return json({data:req})
}

export async function POST ({request}){
    try {
        const data = await request.json()
        const {isError, errorCount} = checkFieldKosong(data)
        if(isError){
            error(500,  `${errorCount} input masih kosong`)
        }

        await prisma.employee.create({
            data:{...data}
        })
    
        return json({message:"Data successfully saved"})
    } catch (err) {
        console.log(err)
        error(500, {message: prismaErrorHandler(err)})
    }
}