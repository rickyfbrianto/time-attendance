import {json} from "@sveltejs/kit"

export async function GET(){
    const req = await fetch('https://jsonplaceholder.typicode.com/todos/2')    
    const res = await req.json()
    return json(res)
}