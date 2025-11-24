import type { PageServerLoad } from "./$types";
import { error, redirect } from '@sveltejs/kit';
import { prisma } from '@lib/utils'

export const load: PageServerLoad = async ({ locals, fetch }) => {
    if (locals.user.user_type != 'HR') error(500, "Only HRD can access this page")

    // const allDept = await prisma.$queryRawUnsafe(`select 
    //     cast(CONCAT_WS(',' ,
    //         SUM(CASE WHEN tmp.cin_ada >= 19 AND tmp.cout_ada >= 19 and bulan = 1 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 1 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN (tmp.cin_ada < 19 AND tmp.cout_ada < 19) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 1 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 1 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 1 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 1 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 1 THEN 1 ELSE 0 END)) as CHAR) jan,
    //     cast(CONCAT_WS(',' ,
    //         SUM(CASE WHEN tmp.cin_ada >= 19 AND tmp.cout_ada >= 19 and bulan = 2 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 2 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN (tmp.cin_ada < 19 AND tmp.cout_ada < 19) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 2 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 2 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 2 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 2 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 2 THEN 1 ELSE 0 END)) as CHAR) feb,
    //     cast(CONCAT_WS(',' ,
    //         SUM(CASE WHEN tmp.cin_ada >= 19 AND tmp.cout_ada >= 19 and bulan = 3 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 3 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN (tmp.cin_ada < 19 AND tmp.cout_ada < 19) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 3 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 3 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 3 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 3 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 3 THEN 1 ELSE 0 END)) as CHAR) mar,
    //     cast(CONCAT_WS(',' ,
    //         SUM(CASE WHEN tmp.cin_ada >= 19 AND tmp.cout_ada >= 19 and bulan = 4 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 4 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN (tmp.cin_ada < 19 AND tmp.cout_ada < 19) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 4 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 4 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 4 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 4 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 4 THEN 1 ELSE 0 END)) as CHAR) apr,
    //     cast(CONCAT_WS(',' ,
    //         SUM(CASE WHEN tmp.cin_ada >= 19 AND tmp.cout_ada >= 19 and bulan = 5 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 5 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN (tmp.cin_ada < 19 AND tmp.cout_ada < 19) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 5 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 5 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 5 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 5 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 5 THEN 1 ELSE 0 END)) as CHAR) mei,
    //     cast(CONCAT_WS(',' ,
    //         SUM(CASE WHEN tmp.cin_ada >= 19 AND tmp.cout_ada >= 19 and bulan = 6 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 6 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN (tmp.cin_ada < 19 AND tmp.cout_ada < 19) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 6 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 6 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 6 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 6 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 6 THEN 1 ELSE 0 END)) as CHAR) jun,
    //     cast(CONCAT_WS(',' ,
    //         SUM(CASE WHEN tmp.cin_ada >= 19 AND tmp.cout_ada >= 19 and bulan = 7 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 7 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN (tmp.cin_ada < 19 AND tmp.cout_ada < 19) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 7 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 7 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 7 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 7 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 7 THEN 1 ELSE 0 END)) as CHAR) jul,
    //     cast(CONCAT_WS(',' ,
    //         SUM(CASE WHEN tmp.cin_ada >= 19 AND tmp.cout_ada >= 19 and bulan = 8 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 8 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN (tmp.cin_ada < 19 AND tmp.cout_ada < 19) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 8 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 8 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 8 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 8 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 8 THEN 1 ELSE 0 END)) as CHAR) agu,
    //     cast(CONCAT_WS(',' ,
    //         SUM(CASE WHEN tmp.cin_ada >= 19 AND tmp.cout_ada >= 19 and bulan = 9 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 9 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN (tmp.cin_ada < 19 AND tmp.cout_ada < 19) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 9 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 9 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 9 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 9 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 9 THEN 1 ELSE 0 END)) as CHAR) sep,
    //     cast(CONCAT_WS(',' ,
    //         SUM(CASE WHEN tmp.cin_ada >= 19 AND tmp.cout_ada >= 19 and bulan = 10 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 10 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN (tmp.cin_ada < 19 AND tmp.cout_ada < 19) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 10 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 10 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 10 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 10 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 10 THEN 1 ELSE 0 END)) as CHAR) okt,
    //     cast(CONCAT_WS(',' ,
    //         SUM(CASE WHEN tmp.cin_ada >= 19 AND tmp.cout_ada >= 19 and bulan = 11 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 11 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN (tmp.cin_ada < 19 AND tmp.cout_ada < 19) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 11 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 11 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 11 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 11 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 11 THEN 1 ELSE 0 END)) as CHAR) nov,
    //     cast(CONCAT_WS(',' ,
    //         SUM(CASE WHEN tmp.cin_ada >= 19 AND tmp.cout_ada >= 19 and bulan = 12 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada = 0 and bulan = 12 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN (tmp.cin_ada < 19 AND tmp.cout_ada < 19) AND (tmp.cin_ada > 0 AND tmp.cout_ada > 0) AND (tmp.cin_ada = tmp.cout_ada) and bulan = 12 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada < tmp.cout_ada and bulan = 12 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada = 0 AND tmp.cout_ada > 0 and bulan = 12 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > tmp.cout_ada and bulan = 12 THEN 1 ELSE 0 END),
    //         SUM(CASE WHEN tmp.cin_ada > 0 AND tmp.cout_ada = 0 and bulan = 12 THEN 1 ELSE 0 END)) as CHAR) des
    //     FROM (
    //         SELECT 'dept' as type,e.department as employee_dept, d.name AS dept_name, MONTH(a.check_in) as bulan,
    //         SUM(CASE WHEN TIME(a.check_in) != '00:00:00' THEN 1 ELSE 0 END) AS cin_ada,
    //         SUM(CASE WHEN TIME(a.check_out) != '00:00:00' THEN 1 ELSE 0 END) AS cout_ada
    //         FROM attendance a
    //         left JOIN employee e ON e.user_id_machine = a.user_id_machine
    //         left JOIN dept d ON d.dept_code = e.department
    //         WHERE YEAR(a.check_in) = 2025 AND DAYOFWEEK(a.check_in) NOT IN (1,7)
    //         GROUP BY e.department, e.user_id_machine, MONTH(a.check_in)
    //     ) as tmp
    //     GROUP BY type
    //     order by employee_dept`)
    const year = new Date().getFullYear()
    const req = await fetch(`/api/data?type=get_report_summary&year=${year}`)
    const res = await req.json()

    return {
        report: {
            dept: res
        }
    }
};