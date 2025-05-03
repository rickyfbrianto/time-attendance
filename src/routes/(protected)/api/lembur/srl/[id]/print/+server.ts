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
                employee:{
                    select:{
                        payroll:true,
                        name:true,
                        signature:true,
                        dept:{
                            select:{
                                initial: true
                            }
                        }
                    }
                },
                real_start:true,
                real_end:true,
                employee_srl_approval1Toemployee:{
                    select:{
                        name:true,
                        signature: true
                    }
                },
                employee_srl_approval2Toemployee:{
                    select:{
                        name: true,
                        signature: true,
                    }
                },
                createdAt:true,
                srl_detail:{
                    select:{
                        description:true,
                        status:true
                    }
                }
            },
            where:{
                srl_id: id,
            }
        }) 
        
        return json(req)
    } catch (err:any) {
        error(500, err.message)
    }
}