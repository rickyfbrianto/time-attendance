import type { PageServerLoad } from "./$types";
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
    if (locals.user.user_type != 'HR') {
        error(500, "Only HRD can access this page")
    }
};