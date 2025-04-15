import { error, json } from "@sveltejs/kit";
import { formatTanggal, prisma } from '@lib/utils'
import { getMonth, getYear } from "date-fns";

export async function GET({url}){
    try {
        const type = url.searchParams.get('type')
        const val = url.searchParams.get('val') || ""
        const date = url.searchParams.get('date')
        const month = url.searchParams.get('month')
        const year = url.searchParams.get('year')

        if(type == "user"){
            const req = await prisma.$queryRawUnsafe(`SELECT payroll, name, user_id_machine, department FROM employee where payroll like ?`,
                `%${val}%`)
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
            const req = await prisma.$queryRawUnsafe(`SELECT * FROM DEPT WHERE dept_code LIKE ?`, `%${val}%`)
            return json(req)
        }else if(type=='spl_by_status'){
            const req = await prisma.$queryRawUnsafe(`
                SELECT s.spl_id, s.purpose, sd.description,
                    DATE(s.est_start) AS srl_date,
                    GetStartOvertime( a.check_in, a.check_out, e.workhour) AS est_start,
                    RoundCheckOut(a.check_in, a.check_out) AS est_end
                FROM
                    spl s, spl_detail sd, employee e, attendance a
                WHERE sd.spl_id = s.spl_id AND e.payroll = sd.payroll AND a.user_id_machine = e.user_id_machine AND DATE ( a.check_in )= DATE (s.est_start) 
                AND NOT EXISTS (SELECT 1 FROM srl WHERE s.spl_id = srl.spl_id)
                AND sd.payroll = ?`, 
                val) as any []
            return json(req)
        }else if(type=='sppd_by_payroll'){
            const req = await prisma.$queryRawUnsafe(`
                SELECT s.sppd_id, s.start_date, s.end_date, s.purpose, s.location
                FROM sppd as s
                LEFT JOIN skpd ON s.sppd_id = skpd.sppd_id
                WHERE skpd.sppd_id IS NULL`)
            return json(req)
        }else if(type=='get_cuti_calendar'){
            const req = await prisma.$queryRawUnsafe(`
                SELECT * FROM calendar 
                WHERE type like ? AND YEAR(date) = ? AND month(date) <= ?
                ORDER BY date asc`, `%${val}%`, year, month)
            return json(req)
        }else if(type=='get_cuti_user'){
            const transact = await prisma.$transaction(async tx => {
                const [cuti] = await tx.$queryRawUnsafe(`
                    SELECT
                    (SELECT getHakCuti(join_date, now()) as cuti FROM employee WHERE payroll = ?) as 'Total Cuti',
                    (SELECT CAST(COUNT(*) as CHAR) as count from cuti where year(date) = ? and STATUS ='Approved') as Cuti`, 
                    val, year) as {'Total Cuti': number, Cuti: number, 'Sisa Cuti': number}[]

                const [getDataLibur] = await tx.$queryRawUnsafe(`
                    select 
                        sum(case when type = 'Cuti Bersama' then 1 else 0 end) AS 'Cuti Bersama',
                        sum(case when type = 'Event Kantor' then 1 else 0 end) AS 'Event Kantor',
                        sum(case when type = 'Hari Libur' then 1 else 0 end) AS 'Hari Libur' 
                        FROM calendar WHERE year(date) = ? AND month(date) <= ?`,
                        year, month
                ) as {'Cuti Bersama':string, 'Event Kantor':string, 'Hari Libur':string}[]

                cuti['Sisa Cuti'] = Number(cuti["Total Cuti"]) - Number(cuti['Cuti']) - Number(getDataLibur['Cuti Bersama'])
                
                const newData = Object.fromEntries(
                    Object.entries({...getDataLibur, ...cuti})
                    .map(([key, value]) => ([key, Number(value)]))
                )
                return {...newData}
            })
            return json(transact)
        }else if(type=='get_attendance_summary_payroll'){
            const req = await prisma.$queryRawUnsafe(`
                select * from attendance as a
                `)

        }else{
            throw new Error("Parameter Invalid")
        }
    } catch (err:any) {
        error(500, err.message)
    }
}