import { error, json } from "@sveltejs/kit";
import { formatTanggal, prisma } from '@lib/utils'

export async function GET({ url }) {
    try {
        const type = url.searchParams.get('type')
        const val = url.searchParams.get('val') || ""
        const date = url.searchParams.get('date')
        const month = url.searchParams.get('month') || ""
        const year = url.searchParams.get('year')
        const payroll = url.searchParams.get('payroll') || ""
        const dept = url.searchParams.get('dept') || ""
        const start_date = url.searchParams.get('start_date') || ""
        const end_date = url.searchParams.get('end_date') || ""

        const tanggal = `${year}-${month.toString().padStart(2, "0")}-01`

        if (type == "user") {
            const req = await prisma.$queryRawUnsafe(`SELECT payroll, name, user_id_machine, department FROM employee where payroll like ?`,
                `%${val}%`)
            return json(req)
        } else if (type == "user_for_ijin") {
            const req = await prisma.employee.findFirst({
                select: {
                    payroll: true,
                    name: true,
                    employee_employee_approverToemployee: {
                        select: {
                            payroll: true, name: true,
                        }
                    },
                    employee_employee_substituteToemployee: {
                        select: {
                            payroll: true, name: true
                        }
                    }
                },
                where: {
                    payroll: val,
                    status: "Aktif"
                }
            })
            return json(req)
        } else if (type == "user_for_lembur") {
            const req = await prisma.$queryRawUnsafe(`SELECT payroll, name, user_id_machine, department 
                FROM employee AS e
                WHERE department LIKE ? && overtime = 1 AND status = 'Aktif'
                ORDER BY name`, `%${val}%`)
            return json(req)
        } else if (type == "user_filter_level") {
            let req = await prisma.$queryRawUnsafe(`
                SELECT e.payroll, e.name, e.user_id_machine, e.department, e.user_type
                FROM employee e JOIN employee u ON u.payroll = ?
                WHERE e.department = ? AND e.level ${(val == "up") ? ">" : (val == "down" ? "<" : "=")} u.level`,
                payroll, dept)
            return json(req)
        } else if (type == "user_by_dept") {
            const req = await prisma.$queryRawUnsafe(`
                SELECT e.payroll, e.name, e.user_id_machine, e.department, e.user_type
                FROM employee as e
                WHERE department LIKE ? AND e.status = 'Aktif'
                ORDER BY name`,
                `%${val}%`)
            return json(req)
        } else if (type == "user_by_user_type") {
            const req = await prisma.$queryRawUnsafe(`
                SELECT e.payroll, e.name, e.user_id_machine, e.department, e.user_type
                FROM employee as e
                WHERE user_type LIKE ? AND e.status = 'Aktif'
                ORDER BY name`,
                `%${val}%`)
            return json(req)
        } else if (type == 'dept') {
            const req = await prisma.$queryRawUnsafe(`SELECT * FROM DEPT WHERE dept_code LIKE ? AND status = 'Aktif'
                ORDER BY dept_code`, `%${val}%`)
            return json(req)
        } else if (type == 'dept_by_divisi') {
            const req = await prisma.$queryRawUnsafe(`SELECT * FROM DEPT WHERE divisi LIKE ? AND status = 'Aktif'
                ORDER BY dept_code`, `%${val}%`)
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
                },
                where: {
                    status: "Aktif"
                }
            })
            return json(req)
        } else if (type == 'spl_by_status') {
            const req = await prisma.$queryRawUnsafe(`
                SELECT s.spl_id, s.purpose, sd.description,
                    DATE(s.est_start) AS srl_date,
                    getStartOvertime(a.attendance_id, e.workhour, e.start_work) AS est_start,
                    roundCheckOut(a.check_in, a.check_out) AS est_end
                FROM
                    spl s, spl_detail sd, employee e, attendance a
                WHERE sd.spl_id = s.spl_id AND e.payroll = sd.payroll AND a.user_id_machine = e.user_id_machine AND DATE ( a.check_in ) = DATE (s.est_start) 
                    AND NOT EXISTS (SELECT 1 FROM srl WHERE s.spl_id = srl.spl_id)
                    AND sd.payroll = ? AND s.status1 = 'Approved'`,
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
                const [Hari_Kerja] = await tx.$queryRawUnsafe(`
                    WITH RECURSIVE date_range AS (
                        SELECT DATE(?) AS tanggal
                        UNION ALL
                        SELECT DATE_ADD(tanggal, INTERVAL 1 DAY)
                        FROM date_range
                        WHERE tanggal < ?)

                        SELECT SUM(CASE WHEN DAYOFWEEK(tanggal) BETWEEN 2 AND 6 THEN 1 ELSE 0 END) as hari_kerja,
                        SUM(CASE WHEN DAYOFWEEK(tanggal) IN (1, 7) THEN 1 ELSE 0 END) as hari_weekend
                        FROM date_range;
                `, start_date, end_date) as { 'hari_kerja': string, 'hari_weekend': string }[]

                const [Day_work] = await tx.$queryRawUnsafe(`
                    select 
                        sum(case when type IN ('HKC','HKM') then 1 else 0 end) AS 'Attendance'
                    FROM attendance as a 
                    LEFT JOIN employee as e ON e.user_id_machine = a.user_id_machine
                    WHERE e.payroll = ? AND DATE(check_in) BETWEEN ? AND ?`,
                    val, start_date, end_date
                ) as { 'Attendance': string }[]

                const [getDataLibur] = await tx.$queryRawUnsafe(`
                    select e.name as Name,
                        sum(case when type = 'Dinas' then 1 else 0 end) AS 'Dinas',
                        sum(case when type = 'Sakit' then 1 else 0 end) AS 'Sakit',
                        sum(case when type = 'Cuti Bersama' then 1 else 0 end) AS 'Cuti Bersama',
                        sum(case when type = 'Cuti Tahunan' then 1 else 0 end) AS 'Cuti Tahunan',
                        sum(case when type = 'Cuti Resmi' then 1 else 0 end) AS 'Cuti Resmi',
                        sum(case when type = 'Ijin Resmi' then 1 else 0 end) AS 'Ijin Resmi'
                    FROM attendance as a
                    LEFT JOIN employee as e ON e.user_id_machine = a.user_id_machine
                    WHERE e.payroll = ? AND year(check_in) = ? AND month(check_in) <= ?`,
                    val, year, month
                ) as { "Name": string, 'Dinas': string, 'Sakit': string, 'Cuti Bersama': string, 'Cuti Tahunan': string, 'Cuti Resmi': string, 'Ijin Resmi': string }[]

                const newData = Object.fromEntries(
                    Object.entries({ ...Hari_Kerja, ...Day_work, ...getDataLibur }).map(([key, value]) => ([key, typeof value == "string" ? value : Number(value)]))
                )

                return { ...newData }
            })
            return json(req)
        } else if (type == 'get_cuti_dashboard') { // ? Fungsi ini untuk menampilkan detail attendance
            const req = await prisma.$queryRawUnsafe(`
                SELECT e.name, a.description, a.check_in as date FROM attendance as a
                LEFT JOIN employee as e ON e.user_id_machine = a.user_id_machine
                WHERE e.payroll = ? AND a.type like ? AND YEAR(a.check_in) = ? AND month(a.check_in) <= ?
                ORDER BY a.check_in asc`,
                payroll, `%${val}%`, year, month)
            return json(req)
        } else if (type == 'get_attendance_by_payroll') {
            const req = await prisma.$queryRawUnsafe(`
                SELECT a.check_in, a.type, a.description FROM attendance as a 
                LEFT JOIN employee as e ON e.user_id_machine = a.user_id_machine
                WHERE e.payroll = ? AND YEAR(a.check_in) = ? AND month(a.check_in) <= ? AND type != ''`,
                val, year, month)
            return json(req)
        } else if (type == 'get_cuti_user') {
            const req = await prisma.$transaction(async tx => {
                const [temp] = await tx.$queryRawUnsafe(`
                    select CutiBersama as 'Cuti Bersama', EventKantor as 'Event Kantor', HariLibur as 'Hari Libur', 
                    HakCuti as 'Hak Cuti', CutiTahunan as 'Cuti Tahunan', HakCuti - CutiTahunan - CutiBersama as 'Sisa Cuti' 
                    FROM (
                        SELECT getHakCuti(e.join_date, CONCAT(?, DATE_FORMAT(CURDATE(), '-%m-%d'))) as HakCuti,
                        SUM(CASE WHEN a.type ='Cuti Tahunan' THEN 1 ELSE 0 END) as CutiTahunan,
                            
                        SUM(CASE WHEN a.type ='Cuti Bersama' THEN 1 ELSE 0 END) as CutiBersama,
                        SUM(CASE WHEN a.type ='Event Kantor' THEN 1 ELSE 0 END) as EventKantor,
                        SUM(CASE WHEN a.type ='Hari Libur' THEN 1 ELSE 0 END) as HariLibur
                        FROM employee e
                        LEFT JOIN attendance as a ON a.user_id_machine = e.user_id_machine AND YEAR(a.check_in) = ?
                        WHERE e.payroll = ? GROUP BY e.payroll, e.name
                    ) temp`,
                    year, year, val) as {}[]
                return Object.fromEntries(Object.entries(temp).map(([key, val]) => ([key, Number(val)])))
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
        } else if (type == "get_report_attendance_dept") {
            const req = await prisma.$transaction(async tx => {
                const result = await tx.$queryRawUnsafe(`
                    SELECT e.name, 
                        getWorkday(e.user_id_machine, ?, LAST_DAY(?)) as 'Workday',
                        SUM(CASE WHEN a.type IN ("HKC","HKM") THEN 1 ELSE 0 END) as 'Attendance',
                        SUM(CASE WHEN a.type = 'Hari Libur' THEN 1 ELSE 0 END) as 'Libur',
                        SUM(CASE WHEN a.type = 'Cuti Bersama' THEN 1 ELSE 0 END) as 'Cuti Bersama',
                        SUM(CASE WHEN a.type = 'Ijin Resmi' THEN 1 ELSE 0 END) as 'Ijin Resmi',
                        SUM(CASE WHEN a.type = 'Sakit' THEN 1 ELSE 0 END) as 'Sakit',
                        SUM(CASE WHEN a.type = 'Dinas' THEN 1 ELSE 0 END) as 'Dinas',
                        SUM(CASE WHEN a.type = 'Mangkir' THEN 1 ELSE 0 END) as 'Mangkir',
                        SUM(CASE WHEN a.type = 'Cuti Tahunan' THEN 1 ELSE 0 END) as 'Cuti Tahunan'

                        FROM attendance as a
                        LEFT JOIN employee as e ON a.user_id_machine = e.user_id_machine
                        WHERE (YEAR(a.check_in) = YEAR(?) AND MONTH(a.check_in) = MONTH(?)) AND e.department = ?
                        GROUP BY a.user_id_machine
                        ORDER BY e.name ASC;`,
                    tanggal, tanggal, tanggal, tanggal, dept) as {}[]
                return result
            })
            return json(req)
        } else if (type == "get_report_disiplin_dept") {
            const req = await prisma.$transaction(async tx => {
                const result = await tx.$queryRawUnsafe(`
                    select e.name, 
                    getWorkday(e.user_id_machine, ?, LAST_DAY(?)) as 'Workday',
                    SUM(CASE WHEN a.type IN ("HKC","HKM") THEN 1 ELSE 0 END) as 'Attendance',
                    SUM(CASE WHEN getLate(a.check_in, e.start_work) = true AND getUserWeekend(a.check_in, e.workhour) = false AND a.ijin_info = "" THEN 1 ELSE 0 END) as 'Late',
                    IFNULL(ROUND(AVG(CASE WHEN getLate(a.check_in, e.start_work) = true AND getUserWeekend(a.check_in, e.workhour) = false AND a.ijin_info = "" THEN TIMESTAMPDIFF(MINUTE, TIME('08:00:00'), TIME(a.check_in)) END)), 0) AS 'Avg Telat (Menit)',
                    SUM(CASE WHEN a.type IN ("HKM") THEN 1 ELSE 0 END) as 'Lupa Kartu',
                    SUM(CASE WHEN TIME(a.check_in) <> '00:00:00' AND TIME(a.check_out) = '00:00:00' THEN 1 ELSE 0 END) AS 'Check In No Out',
                    SUM(CASE WHEN TIME(a.check_in) = '00:00:00' AND TIME(a.check_out) <> '00:00:00' THEN 1 ELSE 0 END) AS 'Check Out No In',
                    IF(SUM(CASE WHEN a.type = "" THEN 1 ELSE 0 END) >= getWorkday(e.user_id_machine, ?, LAST_DAY(?)), 1, '') as 'Never Absen'
                    FROM attendance a 
                    LEFT JOIN employee e ON a.user_id_machine = e.user_id_machine
                    WHERE (YEAR(a.check_in) = YEAR(?) AND MONTH(a.check_in) = MONTH(?)) AND e.department = ?
                    GROUP BY a.user_id_machine
                    ORDER BY e.name ASC`,
                    tanggal, tanggal, tanggal, tanggal, tanggal, tanggal, dept) as {}[]
                return result
            })
            return json(req)
        } else if (type == "get_report_lembur_dept") {
            const req = await prisma.$transaction(async tx => {
                const result = await tx.$queryRawUnsafe(`
                    select e.name, 
                    getWorkday(e.user_id_machine, ?, LAST_DAY(?)) as 'Workday',
                    SUM(CASE WHEN a.type IN ("HKC","HKM") THEN 1 ELSE 0 END) as 'Attendance',
                    SUM(CASE WHEN getSPL(e.payroll, a.check_in) = true THEN 1 ELSE 0 END) as Lembur,
                    SUM(CASE WHEN getSPL(e.payroll, a.check_in) = true THEN 
                        getHourOvertime(IFNULL(TIMESTAMPDIFF(MINUTE, getStartOvertime(a.attendance_id, e.workhour, e.start_work), a.check_out), 0) + IFNULL(TIMESTAMPDIFF(MINUTE, a.check_in2, a.check_out2), 0))
                    ELSE 0 END) as 'Jam Lembur'
                    FROM attendance as a
                    LEFT JOIN employee e ON a.user_id_machine = e.user_id_machine
                    WHERE (YEAR(a.check_in) = YEAR(?) AND MONTH(a.check_in) = MONTH(?)) AND e.department = ? AND e.overtime = true
                    GROUP BY a.user_id_machine
                    ORDER BY e.name ASC`,
                    tanggal, tanggal, tanggal, tanggal, dept) as {}[]
                return result
            })
            return json(req)
        } else if (type == "get_notif") {
            const req = await prisma.$transaction(async tx => {
                const hasil = await tx.$queryRawUnsafe(`
                    SELECT c.createdAt AS waktu, 'cuti' AS link, CONCAT(e.name, " Mengajukan Cuti untuk ", c.description) as deskripsi
                    FROM cuti AS c
                    LEFT JOIN employee AS e ON e.payroll = c.payroll
                    WHERE c.status = 'Waiting' AND c.approval = ?
                    
                    UNION ALL
                    
                    SELECT i.createdAt AS waktu, 'ijin' AS link, CONCAT(e.name, " Mengajukan Ijin untuk ", i.description) as deskripsi
                    FROM ijin AS i
                    LEFT JOIN employee AS e ON e.payroll = i.payroll
                    WHERE i.status = 'Waiting' AND i.approval = ?
                    
                    UNION ALL
                    
                    SELECT s.createdAt AS waktu, 'spl' AS link, CONCAT(e.name, " Mengajukan SPL untuk ",s.purpose) as deskripsi
                    FROM SPL AS s
                    LEFT JOIN spl_detail AS sd ON s.spl_id = sd.spl_id
                    LEFT JOIN employee AS e ON e.payroll = sd.payroll
                    WHERE s.status1 = 'Waiting' AND s.approval1 = ?

                    UNION ALL

                    SELECT s.createdAt AS waktu, 'srl' AS link, CONCAT(e.name, " Mengajukan SRL Level 1 untuk ", spl.purpose) as deskripsi 
                    FROM SRL AS s
                    LEFT JOIN spl ON spl.spl_id = s.spl_id
                    LEFT JOIN employee AS e ON e.payroll = s.payroll
                    WHERE s.status1 = 'Waiting' AND s.approval1 = ?

                    UNION ALL

                    SELECT s.createdAt AS waktu, 'srl' AS link, CONCAT(e.name, " Mengajukan SRL Level 2 untuk ", spl.purpose) as deskripsi 
                    FROM SRL AS s
                    LEFT JOIN spl ON spl.spl_id = s.spl_id
                    LEFT JOIN employee AS e ON e.payroll = s.payroll
                    WHERE s.status1 = 'Approved' AND s.status2 = 'Waiting' AND s.approval2 = ?

                    UNION ALL

                    SELECT s.createdAt AS waktu, 'skpd' AS link, CONCAT("SKPD ", REPLACE(s.skpd_id, "_","/"), " atas nama ", CONCAT(UPPER(LEFT(e.name, 1)),LOWER(SUBSTRING(e.name, 2))), " perlu approve dari anda") as deskripsi 
                    FROM SKPD AS s
                    LEFT JOIN employee AS e ON e.payroll = s.payroll
                    WHERE s.status = 'OPEN' AND s.approve = ?

                    ORDER BY waktu DESC`,
                    payroll, payroll, payroll, payroll, payroll, payroll) as {}[]
                return hasil
            })
            return json(req)
        } else if (type == "get_report_summary") {
            const temp = val.split(',').map(Number)
            const req = await prisma.$queryRawUnsafe(`select dept_name, dept_code,
                cast(CONCAT_WS(',' ,
                    SUM(CASE WHEN tmp.cin_ada >= ${temp[0]} AND tmp.cout_ada >= ${temp[0]} and bulan = 1 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 1 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN (tmp.cin_ada < ${temp[0]} AND tmp.cout_ada < ${temp[0]}) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 1 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 1 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 1 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 1 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 1 THEN 1 ELSE 0 END)) as CHAR) jan,
                cast(CONCAT_WS(',' ,
                    SUM(CASE WHEN tmp.cin_ada >= ${temp[1]} AND tmp.cout_ada >= ${temp[1]} and bulan = 2 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 2 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN (tmp.cin_ada < ${temp[1]} AND tmp.cout_ada < ${temp[1]}) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 2 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 2 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 2 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 2 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 2 THEN 1 ELSE 0 END)) as CHAR) feb,
                cast(CONCAT_WS(',' ,
                    SUM(CASE WHEN tmp.cin_ada >= ${temp[2]} AND tmp.cout_ada >= ${temp[2]} and bulan = 3 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 3 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN (tmp.cin_ada < ${temp[2]} AND tmp.cout_ada < ${temp[2]}) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 3 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 3 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 3 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 3 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 3 THEN 1 ELSE 0 END)) as CHAR) mar,
                cast(CONCAT_WS(',' ,
                    SUM(CASE WHEN tmp.cin_ada >= ${temp[3]} AND tmp.cout_ada >= ${temp[3]} and bulan = 4 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 4 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN (tmp.cin_ada < ${temp[3]} AND tmp.cout_ada < ${temp[3]}) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 4 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 4 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 4 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 4 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 4 THEN 1 ELSE 0 END)) as CHAR) apr,
                cast(CONCAT_WS(',' ,
                    SUM(CASE WHEN tmp.cin_ada >= ${temp[4]} AND tmp.cout_ada >= ${temp[4]} and bulan = 5 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 5 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN (tmp.cin_ada < ${temp[4]} AND tmp.cout_ada < ${temp[4]}) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 5 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 5 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 5 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 5 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 5 THEN 1 ELSE 0 END)) as CHAR) mei,
                cast(CONCAT_WS(',' ,
                    SUM(CASE WHEN tmp.cin_ada >= ${temp[5]} AND tmp.cout_ada >= ${temp[5]} and bulan = 6 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 6 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN (tmp.cin_ada < ${temp[5]} AND tmp.cout_ada < ${temp[5]}) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 6 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 6 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 6 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 6 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 6 THEN 1 ELSE 0 END)) as CHAR) jun,
                cast(CONCAT_WS(',' ,
                    SUM(CASE WHEN tmp.cin_ada >= ${temp[6]} AND tmp.cout_ada >= ${temp[6]} and bulan = 7 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 7 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN (tmp.cin_ada < ${temp[6]} AND tmp.cout_ada < ${temp[6]}) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 7 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 7 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 7 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 7 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 7 THEN 1 ELSE 0 END)) as CHAR) jul,
                cast(CONCAT_WS(',' ,
                    SUM(CASE WHEN tmp.cin_ada >= ${temp[7]} AND tmp.cout_ada >= ${temp[7]} and bulan = 8 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 8 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN (tmp.cin_ada < ${temp[7]} AND tmp.cout_ada < ${temp[7]}) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 8 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 8 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 8 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 8 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 8 THEN 1 ELSE 0 END)) as CHAR) agu,
                cast(CONCAT_WS(',' ,
                    SUM(CASE WHEN tmp.cin_ada >= ${temp[8]} AND tmp.cout_ada >= ${temp[8]} and bulan = 9 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 9 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN (tmp.cin_ada < ${temp[8]} AND tmp.cout_ada < ${temp[8]}) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 9 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 9 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 9 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 9 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 9 THEN 1 ELSE 0 END)) as CHAR) sep,
                cast(CONCAT_WS(',' ,
                    SUM(CASE WHEN tmp.cin_ada >= ${temp[9]} AND tmp.cout_ada >= ${temp[9]} and bulan = 10 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 10 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN (tmp.cin_ada < ${temp[9]} AND tmp.cout_ada < ${temp[9]}) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 10 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 10 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 10 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 10 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 10 THEN 1 ELSE 0 END)) as CHAR) okt,
                cast(CONCAT_WS(',' ,
                    SUM(CASE WHEN tmp.cin_ada >= ${temp[10]} AND tmp.cout_ada >= ${temp[10]} and bulan = 11 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 11 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN (tmp.cin_ada < ${temp[10]} AND tmp.cout_ada < ${temp[10]}) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 11 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 11 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 11 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 11 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 11 THEN 1 ELSE 0 END)) as CHAR) nov,
                cast(CONCAT_WS(',' ,
                    SUM(CASE WHEN tmp.cin_ada >= ${temp[11]} AND tmp.cout_ada >= ${temp[11]} and bulan = 12 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 12 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN (tmp.cin_ada < ${temp[11]} AND tmp.cout_ada < ${temp[11]}) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 12 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 12 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 12 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 12 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 12 THEN 1 ELSE 0 END)) as CHAR) des
                FROM (
                    SELECT 'dept' as type,e.department as dept_code, d.name AS dept_name, MONTH(a.check_in) as bulan,
                    SUM(CASE WHEN TIME(a.check_in) != '00:00:00' THEN 1 ELSE 0 END) AS cin_ada,
                    SUM(CASE WHEN TIME(a.check_out) != '00:00:00' THEN 1 ELSE 0 END) AS cout_ada
                    FROM attendance a
                    JOIN employee e ON e.user_id_machine = a.user_id_machine
                    JOIN dept d ON d.dept_code = e.department
                    WHERE YEAR(a.check_in) = ? AND DAYOFWEEK(a.check_in) NOT IN (1,7) AND a.type NOT IN ('Cuti Bersama', 'Hari Libur', 'Event Kantor')
                    GROUP BY e.department, e.user_id_machine, MONTH(a.check_in)
                ) as tmp
                GROUP BY dept_code
                order by dept_code`, year)
            return json(req)
        } else if (type == "get_report_detail_summary") {
            const req = await prisma.$transaction(async tx => {
                const hasil = await tx.$queryRawUnsafe(`
                    SELECT d.name as dept_name, e.name AS employee_name,
                        SUM(CASE WHEN TIME(a.check_in) != '00:00:00' THEN 1 ELSE 0 END) AS cin_ada,
                        SUM(CASE WHEN TIME(a.check_out) != '00:00:00' THEN 1 ELSE 0 END) AS cout_ada
                    FROM attendance a
                    JOIN employee e ON e.user_id_machine = a.user_id_machine
                    JOIN dept d ON d.dept_code = e.department
                    WHERE YEAR(a.check_in) = ? AND MONTH(a.check_in) = ? AND DAYOFWEEK(a.check_in) NOT IN (1,7) AND e.department = ?
                    GROUP BY e.department, e.user_id_machine
                    ORDER BY d.name, e.name`,
                    year, month, dept)
                return hasil
            })
            return json(req)
        } else {
            throw new Error("Parameter Invalid")
        }
    } catch (err: any) {
        error(500, err.message)
    }
}