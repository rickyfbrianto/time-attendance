import {json} from '@sveltejs/kit'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET({params}){
    const {id} = await params
    const req = await prisma.employee.findUnique({
        where:{payroll:id}
    })
    return json(req)
}