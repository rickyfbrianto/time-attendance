import { error, redirect } from '@sveltejs/kit';
import { prisma } from '$/lib/utils.js'

export async function load({ url, locals, depends }) {
    depends('app:protected')
    if (url.pathname === '/') redirect(303, `/dashboard`)

    const { user, userProfile } = locals

    const getSetting = await prisma.setting.findFirst()
    if (!getSetting && url.pathname != '/admin') {
        redirect(303, `/admin?tab=setting&message=Admin needs to adjust setting`);
    }

    if (!userProfile) throw error(500, "User has no Profile ID")
    if (!user?.department) throw error(500, "User has no department")
    // if (!user?.signature) throw error(500, "User has no signature")

    return {
        user,
        userProfile,
        periode: getSetting
    }
}
