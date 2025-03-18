import { error, json } from "@sveltejs/kit";
import { prisma } from '@lib/utils'

export async function GET({url}){
    try {
        const type = url.searchParams.get('type')
        
        if(type == "user"){
            const req = await prisma.employee.findMany({
                select:{
                    payroll:true,
                    user_id_machine:true,
                    profile_id:true,
                    workhour:true
                }
            })
            return json(req)
        } else if(type == "setting"){
            const req = await prisma.setting.findFirst()
            return json(req)
        } else if(type == "profile"){
            const req = await prisma.profile.findMany()
            return json(req)
        }else{
            throw new Error("Parameter Invalid")
        }
    } catch (err:any) {
        error(500, err.message)
    }
}