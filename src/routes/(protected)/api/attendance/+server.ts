import {json} from '@sveltejs/kit'

export async function POST({request}) {
    const data = await request.formData()
    console.log(data.get('file'))
    return json({data:"ok"})
}