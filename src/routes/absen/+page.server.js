export const load = async ()=>{
    const req = await fetch('https://jsonplaceholder.typicode.com/todos/1')
    const res = await req.json()
        
    return {...res}
}