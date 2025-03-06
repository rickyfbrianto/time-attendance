import {error, json, redirect} from '@sveltejs/kit'
import jwt from 'jsonwebtoken'
import {PrismaClient} from "@prisma/client"
import { decryptData } from '@lib/utils'

export async function load({cookies, request, url, locals}){
    try {
        const redirectTo = url.searchParams.get('redirectTo')
        // const token = cookies.get('token')
        // const user = jwt.verify(token as string, import.meta.env.VITE_JWT_SECRET)
        // return {user}
        
    } catch (err:any) {
        error(500, err.message)
    }
}