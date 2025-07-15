import type { PageServerLoad } from "./$types";
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.userProfile?.user_hrd) {
        error(500, "Only HRD can access this page")
    }
};