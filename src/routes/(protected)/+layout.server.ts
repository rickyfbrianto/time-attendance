import { redirect } from '@sveltejs/kit';
import { prisma } from '@lib/utils.js'

export async function load({ url, locals }) {
    if(url.pathname === '/') redirect(303, `/dashboard`)
    
    const getSetting = await prisma.setting.findFirst()
    if(!getSetting && url.pathname != '/admin'){
        redirect(303, `/admin?tab=setting&message=Admin needs to adjust setting`);
    }

    return {
        user: locals.user, 
        userProfile: locals.userProfile,
        periode: getSetting
    }
}
