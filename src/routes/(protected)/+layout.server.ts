import { redirect } from '@sveltejs/kit';
import { prisma } from '@lib/utils.js'
import {appstore } from '@lib/store/appstore'

export async function load({ url, locals, cookies }) {
    if(url.pathname === '/') redirect(303, `/dashboard`)
    
    const getSetting = await prisma.setting.findFirst()
    if(!getSetting && url.pathname != '/admin'){
        redirect(303, `/admin?tab=setting&message=Admin needs to adjust setting`);
    }

    return {
        user: locals.user, 
        userProfile: locals.userProfile
    }
}
