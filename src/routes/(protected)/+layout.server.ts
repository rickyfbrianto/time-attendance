import { redirect } from '@sveltejs/kit';

export function load({ cookies, url }) {
	if(url.pathname === '/') redirect(303, `/dashboard`)

	if (!cookies.get('token')) {
		redirect(303, `/signin?redirectTo=${url.pathname}`);
	}
}
