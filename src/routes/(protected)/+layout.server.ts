import { redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

export async function load({ cookies, url, locals }) {
    if(url.pathname === '/') redirect(303, `/dashboard`)
        
    const token = cookies.get('token')
    if (!token) redirect(303, `/signin?redirectTo=${url.pathname}&message=Invalid Session`)
    
    jwt.verify(token, import.meta.env.VITE_JWT_SECRET, async (err:any, decoded: any) => {
        if(err){
            redirect(303, `/signin?redirectTo=${url.pathname}&message=Session expired, please login again`);
        }
    })

    const getSetting = await prisma.setting.findFirst()
    if(!getSetting && url.pathname != '/admin'){
        redirect(303, `/admin?tab=setting&message=Admin needs to adjust setting`);
    }
    
    return {
        user:locals.user, 
        userProfile: locals.userProfile
    }
}
