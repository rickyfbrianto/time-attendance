import { error, json } from "@sveltejs/kit";
import { prisma, prismaErrorHandler } from '@lib/utils.js'

export async function GET({ params }) {
    const { id } = params
    const req = await prisma.spl.findUnique({
        select: {
            spl_id: true,
            est_start: true,
            est_end: true,
            approval1: true,
            approval2: true,
            purpose: true,
            spl_detail: {
                select: {
                    payroll: true,
                    description: true,
                    employee: {
                        select: {
                            name: true,
                            dept: {
                                select: {
                                    name: true
                                }
                            }
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
            status1: "Waiting",
            status2: "Waiting",
        },
    })
    return json(req)
}