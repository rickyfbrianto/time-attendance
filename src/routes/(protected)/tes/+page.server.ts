export async function load({fetch}){
    const req = await fetch('/api/admin/profile')
    // const req = await fetch('https://jsonplaceholder.typicode.com/todos/')
    const res = await req.json()
    return {data:res}
}