import { error, redirect } from '@sveltejs/kit';
import { prisma } from '$/lib/utils.js'
import { getMonth, getYear } from 'date-fns';

export async function load({ url, locals, depends, fetch }) {
    depends('app:protected')
    if (url.pathname == '/') throw redirect(307, `/dashboard`)

    const { user, userProfile } = locals
    const getSetting = await prisma.setting.findFirst()
    if (!getSetting && url.pathname != '/admin') {
        redirect(303, `/admin?tab=setting&message=Admin needs to adjust setting`);
    }

    if (!user?.department) throw error(500, "User has no department")
    if (url.pathname !== '/dashboard') {
        if (!userProfile) throw error(500, "User has no Profile ID")
        if (!user.location || !user.email || !user.phone || !user.approver || !user.substitute) throw error(500, "Mohon lengkapi data pribadi anda dulu")
        if (!user?.signature) throw error(500, "Anda tidak memiliki digital signature, silahkan upload signature dahulu")
    }
    if (url.pathname == '/security' && userProfile?.access_security != "R")
        throw error(500, "Anda tidak memiliki akses membuka halaman security")

    const reqNotif = await fetch(`/api/data?type=get_notif&payroll=${user?.payroll || ""}`)
    const notif = await reqNotif.json()

    let year = getYear(new Date())
    let month = getMonth(new Date()) + 1
    const tempReqCutiUser = await fetch(`/api/data?type=get_cuti_user&val=${user.payroll}&year=${year}&month=${month}`)
    const dashboardIjinCuti = await tempReqCutiUser.json()

    // const tempReqCalendarUser = await fetch(`/api/data?type=get_cuti_user&val=${user.payroll}&year=${year}&month=${month}`)
    // const dashboardIjinCuti = await tempReqCutiUser.json()

    return {
        notif,
        user,
        userProfile,
        periode: getSetting,
        dashboardIjinCuti,
    }
}
