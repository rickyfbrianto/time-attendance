import { error, json } from "@sveltejs/kit";
import { prisma, prismaErrorHandler } from '@lib/utils.js'

export async function GET({ params }) {
    const { id } = params
    const req = await prisma.sppd.findUnique({
        select: {
            sppd_id: true,
            purpose: true,
            location: true,
            dept: true,
            start_date: true,
            end_date: true,
            duration: true,
            employee: {
                select: {
                    name: true,
                    position: true
                }
            },
            createdAt: true,
            sppd_detail: {
                select: {
                    payroll: true,
                    description: true,
                    employee: {
                        select: {
                            name: true,
                            position: true,
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
        where: { sppd_id: id },
    })

    return json(req)
}

export async function DELETE({ params }) {
    try {
        const { id } = params
        await prisma.sppd.delete({
            where: {
                sppd_id: id
            }
        })
        return json({ message: "Data berhasil dihapus" })
    } catch (err) {
        error(500, prismaErrorHandler(err))
    }
}