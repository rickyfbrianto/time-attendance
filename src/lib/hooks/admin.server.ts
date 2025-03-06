import { redirect, type Handle } from '@sveltejs/kit';
import jwt from 'jsonwebtoken'

export const handle: Handle = async ({ event, resolve }) => {
        const token = event.cookies.get('token');
        const loginPath = ['/admin', '/cuti']
        const isLoginPath = loginPath.some(val => 
            event.url.pathname.startsWith(val)
        )

        // const isLoginPath = event.url.pathname.startsWith('/(protected)/')
        
        if (isLoginPath) {
            if (!token) {
                redirect(302, '/signin');
            }
            
            const user = jwt.verify(token, import.meta.env.VITE_JWT_SECRET);

            event.locals.user = user.payroll    
        
            if (!event.locals.user) {
                redirect(303, '/signin');
            }
        }
        // if (token) {
        //     try {
        //         const decoded = jwt.verify(token, import.meta.env.VITE_JWT_SECRET);
        //         event.locals.user = decoded.payroll
        //     } catch (err) {
        //         console.error('JWT tidak valid:', err);
        //         event.cookies.delete('jwt', {path:'/'}); // Hapus token jika tidak valid
        //     }
        // }
    
        // if (isLoginPath) {
        //     if (!event.locals.user) {
        //         redirect(303, '/signin'); // Redirect ke login jika tidak ada user
        //     }
        // }

        return resolve(event);
};