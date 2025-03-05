import { redirect, type Handle } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken'

export const handle: Handle = async ({ event, resolve }) => {
    const prisma = new PrismaClient()
    // const session = event.cookies.get(import.meta.env.VITE_TOKEN);
    const token = event.cookies.get('token');
    
    if(token){
        const jwt_payroll = jwt.verify(token, import.meta.env.VITE_TOKEN)
        
        const user = await prisma.employee.findUnique({
            where:{payroll: jwt_payroll.payroll}
        })
        console.log(jwt_payroll)
        console.log(user)
        
        // if(redirectTo){
            //     redirect(302, `/${redirectTo.slice(1)}`)
            // }
    }else{
        console.log('tidak ada session')
        redirect(302, `/auth/signin`)
    }
    

    return await resolve(event);
};