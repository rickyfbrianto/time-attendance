import { sequence } from '@sveltejs/kit/hooks';
import { handle as adminHandle } from '@lib/hooks/admin.server.js';
import { redirect, type Handle } from '@sveltejs/kit';
import jwt, { decode } from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client';
import { RouteOff } from 'lucide-svelte';
// export const handle = sequence(
//   authHandle,   // Jalankan hook autentikasi terlebih dahulu
//   adminHandle   // Kemudian jalankan hook admin
// );
const prisma = new PrismaClient()

export const handle: Handle = async ({event, resolve}) =>{
    const token = event.cookies.get('token')
    let payroll

    if(token){
        jwt.verify(token, import.meta.env.VITE_JWT_SECRET, async (err:any, decoded:any) => {
            if(decoded){
                payroll = decoded?.payroll
            }
        })
    }
    
    const data = await prisma.employee.findUnique({
        select:{
            name:true,
            payroll:true,
            jabatan:true,
            email:true,
            profile:true
        },
        where:{payroll},
    })
    
    event.locals.user = data
    return await resolve(event)
}