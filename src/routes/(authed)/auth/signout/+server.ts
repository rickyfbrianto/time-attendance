import { json } from '@sveltejs/kit'
import { redirect } from '@sveltejs/kit'

export function POST({cookies}){
    cookies.delete('token', {path:"/"})
    // redirect(302, '/auth/signin')
    return json({"message":"Logout berhasil"})
}