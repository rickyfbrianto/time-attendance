import { error, json } from "@sveltejs/kit";
import { prisma, prismaErrorHandler } from '@lib/utils.js'

export async function GET({ params }) {
    const { id } = params
    const req = await prisma.spl.findUnique({
        select: {
            spl_id: true,
            est_start: true,
            est_end: true,
            dept_spl_deptTodept: {
                select: {
                    name: true,
                }
            },
            employee_spl_approval1Toemployee: {
                select: {
                    name: true,
                    signature: true
                }
            },
            employee_spl_createdByToemployee: {
                select: {
                    name: true,
                    signature: true
                }
            },
            spl_detail: {
                select: {
                    description: true,
                    employee: {
                        select: {
                            payroll: true,
                            name: true
                        }
                    }
                },
                orderBy: {
                    step: 'asc'
                }
            },
        },
        where: {
            spl_id: id,
            status1: "Approved"
        },
    })
    return json(req)
}