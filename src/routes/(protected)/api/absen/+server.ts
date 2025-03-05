import {json} from '@sveltejs/kit'

export async function GET(){
    const req = await fetch(`https://jsonplaceholder.typicode.com/todos`)
    const data = await req.json()
    return json(data)
}