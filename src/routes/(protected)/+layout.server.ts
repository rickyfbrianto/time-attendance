import { PrismaClient } from '@prisma/client';
import { redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken'

export function load({ cookies, url, locals }) {
    if(url.pathname === '/') redirect(303, `/dashboard`)
        
    const token = cookies.get('token')
    if (!token) redirect(303, `/signin?redirectTo=${url.pathname}&message=Invalid Session`)
    
    jwt.verify(token, import.meta.env.VITE_JWT_SECRET, async (err:any, decoded: any) => {
        if(err){
            redirect(303, `/signin?redirectTo=${url.pathname}&message=Session expired, please login again`);
        }else if(decoded){
            const prisma = new PrismaClient()
            const user = await prisma.employee.findUnique({
                where:{payroll: decoded.payroll},
                include:{
                    profile:true
                },
                omit:{password:true}
            })
            return {user}
        }
    })
}
