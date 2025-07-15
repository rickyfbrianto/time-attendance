import { error, json } from "@sveltejs/kit"
import { prisma } from '@lib/utils'

export async function GET({ params }) {
    try {
        const { id } = params
        const req = await prisma.$queryRawUnsafe(`
                SELECT c.cuti_id, c.description, c.year, 
                e.payroll as cuti_payroll, e.name as cuti_name, e.signature as cuti_signature, d.initial as cuti_dept,
                approval.name as approval_name, approval.signature as approval_signature,
                sum(case when c.status ='Approved' THEN 1 ELSE 0 END) as approve_cuti, 
                min(CASE WHEN c.status ='Approved' THEN date ELSE NULL END) as start_date,
                max(CASE WHEN c.status ='Approved' THEN date ELSE NULL END) as end_date 
                FROM cuti as c
                LEFT JOIN employee as e on e.payroll = c.payroll
                LEFT JOIN employee as approval on approval.payroll = c.approval
                LEFT JOIN dept as d ON e.department = d.dept_code
                WHERE c.cuti_group_id = ?
            `, id)
        // const req = await prisma.cuti.findUnique({
        //     select: {
        //         cuti_id: true,
        //         type: true,
        //         description: true,
        //         date: true,
        //         year: true,
        //         status: true,
        //         approval: true,
        //         employee: {
        //             select: {
        //                 payroll: true,
        //                 name: true,
        //                 signature: true,
        //                 dept: {
        //                     select: {
        //                         initial: true,
        //                         name: true
        //                     }
        //                 }
        //             }
        //         },
        //         employee_cuti_approvalToemployee: {
        //             select: {
        //                 name: true,
        //                 signature: true
        //             }
        //         },
        //         createdAt: true,
        //     },
        //     where: {
        //         cuti_id: id,
        //     }
        // })

        return json(req)
    } catch (err: any) {
        error(500, err.message)
    }
}