import {json} from '@sveltejs/kit'
import { prisma } from '@lib/utils.js'

export async function GET({params}){
    const {id} = params
    const req = await prisma.employee.findUnique({
        where:{payroll:id},
        omit:{password:true}
    })
    return json(req)
}

export async function DELETE({params}){
    try {
        const {id} = params
        await prisma.employee.delete({
            where:{payroll:id}
        })
        return json({ message: "Data successfully deleted" });
    } catch (error) {
        
    }
}