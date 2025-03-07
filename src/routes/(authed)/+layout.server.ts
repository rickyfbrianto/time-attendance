import { redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken'

// export function load({ cookies, url }) {
export function load(event) {
	const redirectTo = event.url.searchParams.get('redirectTo') ?? "/dashboard"
    const token = event.cookies.get('token')
    if(token){
        jwt.verify(token, import.meta.env.VITE_JWT_SECRET, (err:any, decoded:any) => {
            if(err){
                event.cookies.delete('token', {path:"/"})
            }
            if(decoded){
                redirect(303, redirectTo);
            }
        })
    }
}
