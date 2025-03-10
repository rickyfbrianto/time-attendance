export async function load({fetch}) {
    const req = await fetch('/admin/profile')
    const res = await req.json()
    return {data:res}
}