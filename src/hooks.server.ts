import { sequence } from '@sveltejs/kit/hooks';
import { handle as adminHandle } from '@lib/hooks/admin.server.js';
import { redirect, type Handle } from '@sveltejs/kit';
import jwt, { decode } from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client';
// export const handle = sequence(
//   authHandle,   // Jalankan hook autentikasi terlebih dahulu
//   adminHandle   // Kemudian jalankan hook admin
// );

export const handle: Handle = async ({event, resolve}) =>{
    const token = event.cookies.get('token')
    if(token){
        jwt.verify(token, import.meta.env.VITE_JWT_SECRET, async (err:any, decoded:any) => {
            if(decoded){
                const prisma = new PrismaClient()
                const data = await prisma.employee.findUnique({
                    where:{payroll: decoded.payroll},
                    include:{
                        profile:true
                    },
                    omit:{password:true}
                })
                event.locals.user = data
                return await resolve(event)
            }
        })
    }
    return await resolve(event)
}