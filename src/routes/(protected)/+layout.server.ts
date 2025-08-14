import { error, redirect } from '@sveltejs/kit';
import { prisma } from '$/lib/utils.js'

export async function load({ url, locals, depends, fetch }) {
    depends('app:protected')
    if (url.pathname == '/') throw redirect(307, `/dashboard`)

    const { user, userProfile } = locals
    const getSetting = await prisma.setting.findFirst()
    if (!getSetting && url.pathname != '/admin') {
        redirect(303, `/admin?tab=setting&message=Admin needs to adjust setting`);
    }

    if (!userProfile) throw error(500, "User has no Profile ID")
    if (!user?.department) throw error(500, "User has no department")
    if (url.pathname !== '/dashboard' && (!user.location || !user.email || !user.phone || !user.approver || !user.substitute))
        throw error(500, "Mohon lengkapi data pribadi anda dulu")
    if (url.pathname !== '/dashboard' && !user?.signature)
        throw error(500, "Anda tidak memiliki digital signature, silahkan upload signature dahulu")

    const reqNotif = await fetch(`/api/data?type=get_notif&payroll=${user?.payroll || ""}`)
    const notif = await reqNotif.json()

    return {
        notif,
        user,
        userProfile,
        periode: getSetting
    }
}
