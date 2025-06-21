import { error, json } from "@sveltejs/kit";
import { formatTanggal, prisma } from '@lib/utils'

export async function GET({ url }) {
    try {
        const type = url.searchParams.get('type')
        const val = url.searchParams.get('val') || ""
        const date = url.searchParams.get('date')
        const month = url.searchParams.get('month')
        const year = url.searchParams.get('year')
        const payroll = url.searchParams.get('payroll') || ""
        const start_date = url.searchParams.get('start_date') || ""
        const end_date = url.searchParams.get('end_date') || ""

        if (type == "user") {
            const req = await prisma.$queryRawUnsafe(`SELECT payroll, name, user_id_machine, department FROM employee where payroll like ?`,
                `%${val}%`)
            return json(req)
        } else if (type == "user_for_ijin") {
            const req = await prisma.employee.findFirst({
                select: {
                    payroll: true, name: true,
                    employee_employee_approverToemployee: {
                        select: {
                            payroll: true, name: true,
                            employee_employee_substituteToemployee: {
                                select: { payroll: true, name: true }
                            }
                        }
                    },
                },
                where: { payroll: val }
            })
            return json(req)
        } else if (type == "user_for_lembur") {
            const req = await prisma.$queryRawUnsafe(`SELECT payroll, employee.name, user_id_machine, department 
                FROM employee 
                LEFT JOIN profile on profile.profile_id = employee.profile_id
                WHERE department LIKE ? && employee.overtime = true ORDER BY employee.name`, `%${val}%`)
            return json(req)
        } else if (type == "user_by_dept") {
            const req = await prisma.$queryRawUnsafe(`SELECT payroll, name, user_id_machine, department FROM employee WHERE department LIKE ? ORDER BY name`, `%${val}%`)
            return json(req)
        } else if (type == 'dept') {
            const req = await prisma.$queryRawUnsafe(`SELECT * FROM DEPT WHERE dept_code LIKE ?`, `%${val}%`)
            return json(req)
        } else if (type == "setting") {
            const req = await prisma.setting.findFirst()
            return json(req)
        } else if (type == "profile") {
            const req = await prisma.profile.findMany({
                select: {
                    profile_id: true,
                    name: true,
                    description: true
                }
            })
            return json(req)
        } else if (type == 'spl_by_status') {
            const req = await prisma.$queryRawUnsafe(`
                SELECT s.spl_id, s.purpose, sd.description,
                    DATE(s.est_start) AS srl_date,
                    GetStartOvertime(a.attendance_id, e.workhour, e.start_work) AS est_start,
                    RoundCheckOut(a.check_in, a.check_out) AS est_end
                FROM
                    spl s, spl_detail sd, employee e, attendance a
                WHERE sd.spl_id = s.spl_id AND e.payroll = sd.payroll AND a.user_id_machine = e.user_id_machine AND DATE ( a.check_in )= DATE (s.est_start) 
                    AND NOT EXISTS (SELECT 1 FROM srl WHERE s.spl_id = srl.spl_id)
                    AND sd.payroll = ? AND s.status1 = 'Approved' AND s.status2 = 'Approved'`,
                val) as any[]
            return json(req)
        } else if (type == 'sppd_not_in_skpd') {
            const req = await prisma.$queryRawUnsafe(`
                SELECT s.sppd_id, s.purpose FROM sppd as s
                LEFT JOIN skpd ON s.sppd_id = skpd.sppd_id
                WHERE skpd.sppd_id IS NULL`)
            return json(req)
        } else if (type == 'get_sppd_by_id') {
            const req = await prisma.sppd.findFirst({
                select: {
                    sppd_id: true,
                    start_date: true,
                    end_date: true,
                    location: true,
                    sppd_detail: {
                        select: {
                            payroll: true,
                            description: true,
                            employee: {
                                select: {
                                    user_id_machine: true
                                }
                            }
                        }
                    }
                },
                where: {
                    sppd_id: val
                }
            })
            return json(req)
        } else if (type == 'sum_attendance_by_payroll') {
            const req = await prisma.$transaction(async tx => {
                const [Day_work] = await tx.$queryRawUnsafe(`
                    select 
                        sum(case when type IN ('HKC','HKM') then 1 else 0 end) AS 'Day Work'
                    FROM attendance as a 
                    LEFT JOIN employee as e ON e.user_id_machine = a.user_id_machine
                    WHERE e.payroll = ? AND DATE(check_in) BETWEEN ? AND ?`,
                    val, start_date, end_date
                ) as { 'Day Work': string }[]

                const [getDataLibur] = await tx.$queryRawUnsafe(`
                    select e.name as Name,
                        sum(case when type = 'Dinas' then 1 else 0 end) AS 'Dinas',
                        sum(case when type = 'Sakit' then 1 else 0 end) AS 'Sick',
                        sum(case when type = 'Cuti Bersama' then 1 else 0 end) AS 'Cuti Bersama',
                        sum(case when type = 'Cuti Tahunan' then 1 else 0 end) AS 'Cuti Tahunan',
                        sum(case when type = 'Cuti Resmi' then 1 else 0 end) AS 'Cuti Resmi',
                        sum(case when type = 'Ijin Resmi' then 1 else 0 end) AS 'Ijin Resmi'
                    FROM attendance as a
                    LEFT JOIN employee as e ON e.user_id_machine = a.user_id_machine
                    WHERE e.payroll = ? AND year(check_in) = ? AND month(check_in) <= ?`,
                    val, year, month
                ) as { "Name": string, 'Dinas': string, 'Sick': string, 'Cuti Bersama': string, 'Cuti Tahunan': string, 'Cuti Resmi': string, 'Ijin Resmi': string }[]

                const newData = Object.fromEntries(
                    Object.entries({ ...Day_work, ...getDataLibur }).map(([key, value]) => ([key, typeof value == "string" ? value : Number(value)]))
                )

                return { ...newData }
            })
            return json(req)
        } else if (type == 'get_calendar') {
            const req = await prisma.$queryRawUnsafe(`
                SELECT * FROM calendar 
                WHERE type like ? AND YEAR(date) = ? AND month(date) <= ?
                ORDER BY date asc`,
                `%${val}%`, year, month)
            return json(req)
        } else if (type == 'get_attendance_by_payroll') {
            const req = await prisma.$queryRawUnsafe(`
                SELECT a.check_in, a.type, a.description FROM attendance as a 
                LEFT JOIN employee as e ON e.user_id_machine = a.user_id_machine
                WHERE e.payroll = ? AND YEAR(a.check_in) = ? AND month(a.check_in) <= ? AND type != 'Cuti Bersama' AND type != ''`,
                val, year, month)
            return json(req)
        } else if (type == 'get_cuti_user') {
            const req = await prisma.$transaction(async tx => {
                const [cuti] = await tx.$queryRawUnsafe(`
                    SELECT
                    (SELECT getHakCuti(join_date, now()) as cuti FROM employee WHERE payroll = ?) as 'Total Cuti',
                    (SELECT CAST(COUNT(*) as CHAR) as count from cuti WHERE payroll = ? AND year(date) = ? and STATUS ='Approved') as Cuti`,
                    val, val, year) as { 'Total Cuti': number, Cuti: number, 'Sisa Cuti': number }[]

                const [ijin] = await tx.$queryRawUnsafe(`
                    select 
                        sum(case when status = 'Approved' then 1 else 0 end) AS 'Ijin'
                        FROM ijin WHERE payroll = ? AND year(date) = ? AND month(date) <= ?`,
                    val, year, month
                ) as { 'Ijin': string }[]

                const [getDataLibur] = await tx.$queryRawUnsafe(`
                    select 
                        sum(case when type = 'Cuti Bersama' then 1 else 0 end) AS 'Cuti Bersama',
                        sum(case when type = 'Event Kantor' then 1 else 0 end) AS 'Event Kantor',
                        sum(case when type = 'Hari Libur' then 1 else 0 end) AS 'Hari Libur' 
                        FROM calendar WHERE year(date) = ? AND month(date) <= ?`,
                    year, month
                ) as { 'Cuti Bersama': string, 'Event Kantor': string, 'Hari Libur': string }[]

                cuti['Sisa Cuti'] = Number(cuti["Total Cuti"]) - Number(cuti['Cuti']) - Number(getDataLibur['Cuti Bersama'])

                const newData = Object.fromEntries(
                    Object.entries({ ...getDataLibur, ...ijin, ...cuti })
                        .map(([key, value]) => ([key, Number(value)]))
                )
                return { ...newData }
            })
            return json(req)
        } else if (type == 'get_report_dashboard1') {
            const req = await prisma.$transaction(async tx => {
                const [attendance] = await tx.$queryRawUnsafe(`
                    SELECT 
                        SUM(CASE WHEN type IN ('HKC', 'HKM') then 1 else 0 end) AS 'Kehadiran',
                        SUM(CASE WHEN type = 'Sakit' then 1 else 0 end) AS 'Sakit',
                        SUM(CASE WHEN type = 'Ijin Resmi' then 1 else 0 end) AS 'Ijin',
                        SUM(CASE WHEN type = 'Dinas' then 1 else 0 end) AS 'Dinas',
                        SUM(CASE WHEN type = 'Cuti Tahunan' then 1 else 0 end) AS 'Cuti'
                    FROM attendance att 
                    LEFT JOIN employee as user ON user.user_id_machine = att.user_id_machine 
                    WHERE user.payroll = ? AND DATE(check_in) BETWEEN ? AND ?`,
                    payroll, start_date, end_date) as {}[]

                const newData = Object.fromEntries(
                    Object.entries({ ...attendance })
                        .map(([key, value]) => ([key, Number(value)]))
                )
                return { ...newData }
            })
            return json(req)
        } else {
            throw new Error("Parameter Invalid")
        }
    } catch (err: any) {
        error(500, err.message)
    }
}