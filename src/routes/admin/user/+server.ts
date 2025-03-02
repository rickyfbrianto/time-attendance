import {json} from '@sveltejs/kit'
import { PrismaClient } from '@prisma/client'

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
    const data = await request.json()

    return json({...data, status:"ok"})
}