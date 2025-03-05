import {json} from '@sveltejs/kit'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
    const req = await prisma.profile.findMany({
        select:{
            profile_id:true,
            name:true,
            description:true,
            level:true,
            user_hrd:true,
            delegation:true
        }
    })
    return json({data:req})
}

export async function POST ({request}){
    const data = await request.json()

    return json({...data, status:"ok"})
}