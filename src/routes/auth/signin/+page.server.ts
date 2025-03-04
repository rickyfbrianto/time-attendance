import {redirect} from '@sveltejs/kit'

export async function load(e){
    const redirectTo = e.url.searchParams.get('redirectTo')
    // if(redirectTo){
    //     redirect(302, `/${redirectTo.slice(1)}`)
    // }
    // redirect(302, `/`)
}