import { error, json, type RequestHandler } from "@sveltejs/kit"
import { prisma } from '@lib/utils'

export const GET: RequestHandler<{ id: string }> = async ({ params }) => {
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

        return json(req)
    } catch (err: any) {
        error(500, err.message)
    }
}