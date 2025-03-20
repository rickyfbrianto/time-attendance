import {prisma} from '@lib/utils'
import { error, json } from '@sveltejs/kit'

export async function GET({params}){
    try {
        const {id} = params       
        const req = await prisma.srl.findUnique({
            include:{
                employee:{
                    select:{
                        name:true
                    }
                }
            },
            where:{
                srl_id: id
            }
        }) 
        // const items = await prisma.$queryRawUnsafe(`SELECT srl.*, e.name
        //     FROM srl LEFT JOIN employee e ON e.payroll = srl.payroll
        // WHERE srl_id = ?`, id)
        
        return json(req)
        
        const status = await prisma.$transaction(async (tx) => {        
            // const items = await tx.$queryRawUnsafe(`SELECT DATE( s.est_start ) AS srl_date,
            //     TIME (GetStartOvertime ( a.check_in, a.check_out, e.workhour )) AS start_ot,
            //     Time(RoundCheckOut(a.check_in, a.check_out )) AS check_out,
            //     CAST(TIMESTAMPDIFF( HOUR, GetStartOvertime ( a.check_in, a.check_out, e.workhour ), a.check_out ) as CHAR) AS overtime
            // FROM
            //     spl s, spl_detail sd, employee e, attendance a 
            // WHERE
            //     sd.spl_id = s.spl_id AND e.payroll = sd.payroll AND a.user_id_machine = e.user_id_machine AND DATE ( a.check_in )= DATE (s.est_start)`)
    
            // const tempTotal = await tx.$queryRawUnsafe(`SELECT CAST(COUNT(*) as CHAR) as count FROM
            //     spl s, spl_detail sd, employee e, attendance a 
            // WHERE
            //     sd.spl_id = s.spl_id AND e.payroll = sd.payroll AND a.user_id_machine = e.user_id_machine AND DATE ( a.check_in )= DATE (s.est_start)`)
            
                        
        })
    } catch (err) {
        error(500, err)
    }
}