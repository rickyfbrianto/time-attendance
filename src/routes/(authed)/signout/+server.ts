import { json } from '@sveltejs/kit'

export function POST({cookies}){
    cookies.delete('token', {path:"/"})
    return json({"message":"Logout success"})
}