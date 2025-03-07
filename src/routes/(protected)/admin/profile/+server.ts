import {error, json} from '@sveltejs/kit'
import { PrismaClient } from '@prisma/client'
import { checkFieldKosong, prismaErrorHandler } from '@lib/utils'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

export async function GET() {
    const req = await prisma.profile.findMany({
        // select:{
        //     profile_id:true,
        //     name:true,
        //     description:true,
        //     level:true,
        //     user_hrd:true,
        //     delegation:true
        // }
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

        await prisma.profile.create({
            data:{...data,
                profile_id: nanoid()
            }
        })
    
        return json({message:"Data successfully saved"})
    } catch (err) {
        console.log(err)
        error(500, {message: prismaErrorHandler(err)})
    }
}