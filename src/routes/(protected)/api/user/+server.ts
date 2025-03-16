import { prisma } from '@lib/utils.js'
import { json } from '@sveltejs/kit'

export async function GET({locals, url}){
    const payroll = url.searchParams.get('payroll')

    const data = await prisma.employee.findFirst({
        select:{
            payroll:true,
            name:true,
            position:true,
            email:true,
            profile:true,
            department:true,
            location:true
        },
        where:{payroll : payroll},
    })
    
    return json({user: data})
}