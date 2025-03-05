import { redirect } from '@sveltejs/kit';

export function load({ cookies, url }) {
	if (!cookies.get('token')) {
		redirect(303, `/auth/signin?redirectTo=${url.pathname}`);
	}
}
