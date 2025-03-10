import {error, json} from '@sveltejs/kit'
import { PrismaClient } from '@prisma/client'
import { checkFieldKosong, prismaErrorHandler, encryptData } from '@lib/utils'

const prisma = new PrismaClient()

export async function GET() {
    const req = await prisma.employee.findMany({
        select:{
            payroll:true,
            name:true,
            jabatan:true,
            department:true,
            location:true,
            email:true
        }
    })
    return json(req)
}

export async function POST ({request}){
    try {
        const data = await request.json()
        const {isError, errorCount} = checkFieldKosong(data)
        if(isError){
            error(500,  `${errorCount} input masih kosong`)
        }

        await prisma.employee.create({
            data:{...data,
                password: encryptData(data.password, import.meta.env.VITE_KEY)
            }
        })
    
        return json({message:"Data successfully saved"})
    } catch (err) {
        console.log(err)
        error(500, {message: prismaErrorHandler(err)})
    }
}