export const actions = {
    tes: async ({cookies, request})=>{
        const data = await request.formData()
        console.log(data)
    }
}