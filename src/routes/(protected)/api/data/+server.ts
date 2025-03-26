import { error, json } from "@sveltejs/kit";
import { prisma } from '@lib/utils'

export async function GET({url}){
    try {
        const type = url.searchParams.get('type')
        const val = url.searchParams.get('val')
        const date = url.searchParams.get('date')
        const year = url.searchParams.get('year')

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
                SELECT s.spl_id, s.purpose, s.est_start, s.est_end, sd.description
                FROM spl as s
                LEFT JOIN spl_detail as sd ON s.spl_id = sd.spl_id
                WHERE sd.payroll = ? AND NOT EXISTS (SELECT 1 FROM srl WHERE s.spl_id = srl.spl_id)`, val) as any []
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
        }else if(type=='sppd_by_payroll'){
            const req = await prisma.$queryRawUnsafe(`
                SELECT s.sppd_id, s.start_date, s.end_date, s.purpose, sd.payroll, sd.location, sd.description FROM sppd as s
                LEFT JOIN sppd_detail as sd ON s.sppd_id = sd.sppd_id
                WHERE sd.payroll = ?`, val)
            return json(req)
        }else if(type=='get_cuti'){
            const transact = await prisma.$transaction(async tx => {
                const [cuti] = await tx.$queryRawUnsafe(`
                    SELECT
                    (SELECT getHakCuti(join_date, now()) as cuti FROM employee WHERE payroll = ?) as 'Total Cuti',
                    (SELECT CAST(COUNT(*) as CHAR) as count from cuti where year(date) = year(now()) and STATUS ='Approved') as Cuti`, 
                    val) as {'Total Cuti': number, Cuti: number}[]

                const [getDataLibur] = await tx.$queryRawUnsafe(`
                    select 
                        sum(case when type = 'Cuti Bersama' then 1 else 0 end) AS 'Cuti Bersama',
                        sum(case when type = 'Event Kantor' then 1 else 0 end) AS 'Event Kantor',
                        sum(case when type = 'Hari Libur' then 1 else 0 end) AS 'Hari Libur' 
                    FROM calendar WHERE year(date) = year(now()) AND month(date) <= month(now())`,
                ) as {'Cuti Bersama':string, 'Event Kantor':string, 'Hari Libur':string}[]

                const newData = Object.fromEntries(
                    Object.entries({...cuti, ...getDataLibur})
                    .map(([key, value]) => ([key, Number(value)]))
                )
                newData['Sisa Cuti'] = newData['Total Cuti'] - newData['Cuti'] - newData['Cuti Bersama']

                return {...newData}
            })
            return json(transact)
        }else{
            throw new Error("Parameter Invalid")
        }
    } catch (err:any) {
        error(500, err.message)
    }
}