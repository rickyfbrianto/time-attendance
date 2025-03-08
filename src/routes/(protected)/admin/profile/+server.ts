import {error, json} from '@sveltejs/kit'
import { PrismaClient } from '@prisma/client'
import { checkFieldKosong, prismaErrorHandler } from '@lib/utils'
import { v4 as uuid4 } from 'uuid'

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
    return json(req)
}

export async function POST ({request}){
    try {
        const data = await request.json()
        const {isError, errorCount} = checkFieldKosong(data)
        if(isError){
            error(500,  {message:`${errorCount} input masih kosong`})
        }

        await prisma.profile.create({
            data:{...data,
                profile_id: uuid4()
            }
        }).then(()=>{
            return json({message:"Data successfully saved"})
        })
    
    } catch (err) {
        console.log(err)
        error(500, {message: prismaErrorHandler(err)})
    }
}

export async function DELETE ({params}){
    const id = await params.id
    return json({id})
}