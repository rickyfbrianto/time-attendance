import {json} from '@sveltejs/kit'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET({params}){
    const {id} = await params
    const req = await prisma.employee.findUnique({
        where:{payroll:id},
        omit:{password:true}
    })
    return json(req)
}

export async function DELETE({params}){
    try {
        const {id} = await params
        await prisma.employee.delete({
            where:{payroll:id}
        })
        return json({ message: "Data successfully deleted" });
    } catch (error) {
        
    }
}