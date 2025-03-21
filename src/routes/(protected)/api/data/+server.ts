import { error, json } from "@sveltejs/kit";
import { prisma } from '@lib/utils'

export async function GET({url}){
    try {
        const type = url.searchParams.get('type')
        const val = url.searchParams.get('val')

        if(type == "user"){
            const req = await prisma.$queryRawUnsafe(`
                SELECT payroll, name, user_id_machine, department FROM employee`)
            return json(req)
        }else if(type == "user_by_dept"){
            const req = await prisma.$queryRawUnsafe(`
                SELECT payroll, name, department FROM employee WHERE department LIKE ?`, `%${val || ""}%`)
            return json(req)
        } else if(type == "setting"){
            const req = await prisma.setting.findFirst()
            return json(req)
        } else if(type == "profile"){
            const req = await prisma.profile.findMany()
            return json(req)
        }else if(type=='dept'){
            const req = await prisma.$queryRawUnsafe(`
                SELECT * FROM DEPT WHERE dept_code LIKE ?`, `%${val || ""}%`)
            return json(req)
        }else if(type=='spl_by_status'){
            const req = await prisma.$queryRawUnsafe(`
                SELECT * FROM spl WHERE status LIKE ?`, `%${val || ""}%`)
            return json(req)
        }else if(type=='spl_detail_by_spl_id'){
            const req = await prisma.$queryRawUnsafe(`
                SELECT sd.payroll, sd.description, e.name FROM spl_detail sd
                LEFT JOIN employee e ON e.payroll = sd.payroll
                WHERE sd.spl_id LIKE ?`, `%${val || ""}%`)
            // const req = await prisma.$queryRawUnsafe(`
            //     SELECT s.dept, sd.payroll, sd.description, e.name 
            //     FROM spl s
            //     LEFT JOIN spl_detail sd ON s.spl_id = sd.spl_id
            //     LEFT JOIN employee e ON e.payroll = sd.payroll
            //     WHERE sd.spl_id LIKE ?`, `%${val || ""}%`)
            return json(req)
        }else if(type=='srl_calculation_overflow'){
            const req = await prisma.$queryRawUnsafe(`
                SELECT DATE( s.est_start ) AS srl_date,
                    GetStartOvertime( a.check_in, a.check_out, e.workhour) AS check_in,
                    RoundCheckOut(a.check_in, a.check_out) AS check_out,
                    CAST(TIMESTAMPDIFF( HOUR, GetStartOvertime ( a.check_in, a.check_out, e.workhour ), a.check_out ) as CHAR) AS overtime
                FROM
                    spl s, spl_detail sd, employee e, attendance a 
                WHERE
                    sd.spl_id = s.spl_id AND e.payroll = sd.payroll AND a.user_id_machine = e.user_id_machine AND DATE ( a.check_in )= DATE (s.est_start) AND sd.payroll = ?`, val)
            return json(req)
        }else{
            throw new Error("Parameter Invalid")
        }
    } catch (err:any) {
        error(500, err.message)
    }
}