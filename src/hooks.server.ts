import { sequence } from '@sveltejs/kit/hooks';
import { handle as authHandle } from '@lib/hooks/auth.server.js';
import { handle as authAPI } from '@lib/hooks/api.server.js';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle = sequence(
    authHandle,
    authAPI,
);

// export const handle: Handle = async ({event, resolve}) =>{
//     const token = event.cookies.get('token')
//     let payroll

//     if(token){
//         jwt.verify(token, import.meta.env.VITE_JWT_SECRET, async (err:any, decoded:any) => {
//             if(decoded){
//                 payroll = decoded?.payroll
//             }
//         })
//     }
    
//     const data = await prisma.employee.findFirst({
//         select:{
//             payroll:true,
//             name:true,
//             position:true,
//             email:true,
//             profile:true,
//             department:true,
//             location:true
//         },
//         where:{payroll},
//     })
    
//     event.locals.user = data
//     event.locals.userProfile = data?.profile || null
//     return await resolve(event)
// }