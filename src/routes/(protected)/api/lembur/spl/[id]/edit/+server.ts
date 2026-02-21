import { json, type RequestHandler } from "@sveltejs/kit";
import { prisma } from '@lib/utils.js'

export const GET: RequestHandler<{ id: string }> = async ({ params }) => {
    const { id } = params
    const req = await prisma.spl.findUnique({
        select: {
            spl_id: true,
            est_start: true,
            est_end: true,
            approval1: true,
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
        },
    })
    return json(req)
}