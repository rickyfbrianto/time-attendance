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

        return resolve(event);
};