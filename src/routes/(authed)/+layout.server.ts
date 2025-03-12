import { redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken'

export function load({ cookies, url }) {
	const redirectTo = url.searchParams.get('redirectTo') ?? "/dashboard"
    const token = cookies.get('token')
    if(token){
        jwt.verify(token, import.meta.env.VITE_JWT_SECRET, (err:any, decoded:any) => {
            if(err){
                cookies.delete('token', {path:"/"})
            }
            if(decoded){
                redirect(303, redirectTo);
            }
        })
    }
}
