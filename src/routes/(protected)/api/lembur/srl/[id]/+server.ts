import {prisma} from '@lib/utils'
import { error, json } from '@sveltejs/kit'

export async function GET({params}){
    try {
        const {id} = params       
        const req = await prisma.srl.findUnique({
            select:{
                srl_id:true,
                spl_id:true,
                payroll:true,
                real_start:true,
                real_end:true,
                status:true,
                createdAt:true,
                srl_detail:{
                    select:{
                        description:true,
                        status:true
                    }
                }
            },
            where:{
                srl_id: id
            }
        }) 
        
        return json(req)
    } catch (err:any) {
        error(500, err.message)
    }
}