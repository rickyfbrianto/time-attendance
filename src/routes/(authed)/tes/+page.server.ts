import {redirect, json} from '@sveltejs/kit'

export async function load(e){
    const {pathname, search} = e.url
    const redirectTo = pathname+search

    // redirect(302,`/auth/signin?redirectTo=${redirectTo}`)
}