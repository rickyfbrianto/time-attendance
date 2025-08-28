import { error, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken'
import { type Handle } from '@sveltejs/kit';
import { prisma } from '$/lib/utils.js'
import { Prisma } from '@prisma-app/client';

export const handle: Handle = async ({ event, resolve }) => {
    try {
        const { cookies, url, route } = event
        const rootGroup = route.id?.split('/').filter(v => v)[0]
        const token = cookies.get('token')
        let payroll

        if (rootGroup == "(protected)") {
            if (!token) {
                throw new Error(`/signin?redirectTo=${url.pathname}`)
            } else {
                // jwt.verify(token, import.meta.env.VITE_JWT_SECRET, (err:any, decoded: any) => {
                jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
                    if (err) {
                        throw new Error(`/signin?redirectTo=${url.pathname}&message=Session expired, please login again`)
                    } else if (decoded) {
                        payroll = decoded?.payroll
                    }
                })
            }
        }

        const data = await prisma.employee.findFirst({
            select: {
                payroll: true,
                name: true,
                position: true,
                email: true,
                profile: true,
                department: true,
                dept: {
                    select: {
                        dept_code: true,
                        initial: true
                    }
                },
                location: true,
                workhour: true,
                join_date: true,
                phone: true,
                approver: true,
                substitute: true,
                signature: true,
                user_type: true,
                cuti_kunci: true,
                cuti_suspen: true,
                level: true,
                employee_employee_approverToemployee: {
                    select: {
                        payroll: true,
                        name: true,
                    }
                },
                employee_employee_substituteToemployee: {
                    select: {
                        payroll: true,
                        name: true
                    }
                }
            },
            where: { payroll },
        })

        event.locals.user = data
        event.locals.userProfile = data?.profile || null
        return await resolve(event)
    } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === 'P1001') error(500, 'Database tidak tersambung, pastikan server database aktif')
            if (err.code === 'P1002') error(500, 'Database timeout, pastikan jaringan normal')
            if (err.code === 'P1003') error(500, 'Database tidak ada')
        }

        if (err.status == 500)
            error(500, err.body.message)
        else
            redirect(303, err.message)
    }
}