import { error, json } from "@sveltejs/kit";
import { formatTanggal, prisma } from '@lib/utils'

export async function GET({url}){
    try {
        const type = url.searchParams.get('type')
        const val = url.searchParams.get('val') || ""
        const date = url.searchParams.get('date')
        const month = url.searchParams.get('month')
        const year = url.searchParams.get('year')

        if(type == "user"){
            const req = await prisma.$queryRawUnsafe(`SELECT payroll, name, user_id_machine, department FROM employee where payroll like ?`, `%${val}%`)
            return json(req)
        }else if(type == "user_by_dept"){
            const req = await prisma.$queryRawUnsafe(`SELECT payroll, name, user_id_machine, department FROM employee WHERE department LIKE ?`, `%${val}%`)
            return json(req)
        }else if(type=='dept'){
            const req = await prisma.$queryRawUnsafe(`SELECT * FROM DEPT WHERE dept_code LIKE ?`, `%${val}%`)
            return json(req)
        } else if(type == "setting"){
            const req = await prisma.setting.findFirst()
            return json(req)
        } else if(type == "profile"){
            const req = await prisma.profile.findMany()
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
                SELECT s.sppd_id, s.start_date, s.end_date, s.purpose, s.location, GROUP_CONCAT(sd.payroll SEPARATOR  ',') as payroll
                FROM sppd as s
                LEFT JOIN sppd_detail as sd ON s.sppd_id = sd.sppd_id
                LEFT JOIN skpd ON s.sppd_id = skpd.sppd_id
                WHERE skpd.sppd_id IS NULL
                group by s.sppd_id`)
            return json(req)
        }else if(type=='attendance_by_payroll'){
            const req = await prisma.$transaction(async tx => {
                const [getDataLibur] = await tx.$queryRawUnsafe(`
                    select e.name as Name,
                        sum(case when type IN ('HKC','HKM') then 1 else 0 end) AS 'Day Work',
                        sum(case when type = 'Sakit' then 1 else 0 end) AS 'Sick',
                        sum(case when type = 'Cuti Bersama' then 1 else 0 end) AS 'Cuti Bersama',
                        sum(case when type = 'Cuti Tahunan' then 1 else 0 end) AS 'Cuti Tahunan',
                        sum(case when type = 'Cuti Resmi' then 1 else 0 end) AS 'Cuti Resmi',
                        sum(case when type = 'Ijin Resmi' then 1 else 0 end) AS 'Ijin Resmi'
                    FROM attendance as a
                    LEFT JOIN employee as e ON e.user_id_machine = a.user_id_machine
                    WHERE e.payroll = ? AND year(check_in) = ? AND month(check_in) <= ?`,
                    val, year, month
                ) as {"Name":string, 'Day Work':string, 'Sick':string, 'Cuti Bersama': string, 'Cuti Tahunan':string, 'Cuti Resmi':string, 'Ijin Resmi':string}[]
                
                const newData = Object.fromEntries(
                    Object.entries({...getDataLibur}).map(([key, value]) => ([key, typeof value == "string" ? value : Number(value)]))
                )  
                return {...newData}
            })
            return json(req)
        }else if(type=='get_cuti_calendar'){
            const req = await prisma.$queryRawUnsafe(`
                SELECT * FROM calendar 
                WHERE type like ? AND YEAR(date) = ? AND month(date) <= ?
                ORDER BY date asc`, `%${val}%`, year, month)
            return json(req)
            
        }else if(type=='get_cuti_user'){
            const req = await prisma.$transaction(async tx => {
                const [cuti] = await tx.$queryRawUnsafe(`
                    SELECT
                    (SELECT getHakCuti(join_date, now()) as cuti FROM employee WHERE payroll = ?) as 'Total Cuti',
                    (SELECT CAST(COUNT(*) as CHAR) as count from cuti WHERE payroll = ? AND year(date) = ? and STATUS ='Approved') as Cuti`, 
                    val, val, year) as {'Total Cuti': number, Cuti: number, 'Sisa Cuti': number}[]

                const [ijin] = await tx.$queryRawUnsafe(`
                    select 
                        sum(case when status = 'Approved' then 1 else 0 end) AS 'Ijin'
                        FROM ijin WHERE payroll = ? AND year(date) = ? AND month(date) <= ?`,
                        val, year, month
                ) as {'Ijin':string}[]

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
                    Object.entries({...getDataLibur, ...ijin, ...cuti})
                    .map(([key, value]) => ([key, Number(value)]))
                )
                return {...newData}
            })
            return json(req)
        }else{
            throw new Error("Parameter Invalid")
        }
    } catch (err:any) {
        error(500, err.message)
    }
}