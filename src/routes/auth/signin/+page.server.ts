import {error, json, redirect} from '@sveltejs/kit'
import { SECRET_KEY } from '$env/static/private'
import jwt from 'jsonwebtoken'

export async function load({cookies, request, url, locals}){
    try {
        const redirectTo = url.searchParams.get('redirectTo')
        // const token = cookies.get('token')
        // const user = jwt.verify(token as string, import.meta.env.VITE_TOKEN)
        // return {user}
        
    } catch (err:any) {
        error(500, err.message)
    }
}