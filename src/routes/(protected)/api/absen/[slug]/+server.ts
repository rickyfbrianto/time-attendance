import {json} from "@sveltejs/kit"

export async function GET({params}:{params:{slug:string}}){
    const req = await fetch(`https://jsonplaceholder.typicode.com/todos/${params.slug}`)
    const res = await req.json()
    return json(res)
}