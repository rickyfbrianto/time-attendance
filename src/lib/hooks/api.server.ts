import { error, type Handle } from "@sveltejs/kit";
import jwt from 'jsonwebtoken'

export const handle: Handle = async ({event, resolve}) =>{
    try {
        const {url, cookies, route } = event
        const rootGroup = route.id?.split('/').filter(v => v)[0]
        const rootRoute = url.pathname.split('/').filter(v => v)[0]
        const token = cookies.get('token')

        if(rootGroup == "(protected)" && rootRoute == "api"){
            if(!token) {
                throw new Error('API is protected by Valid Token')
            } else if(token){
                jwt.verify(token, import.meta.env.VITE_JWT_SECRET, (err:any) => {
                    if(err) throw new Error('Invalid Token, please login to get valid token')
                })
            }
        }

        return await resolve(event)
    } catch (err: any) {
        error(500, err.message)
    }
}