import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from '../../$types';

// export function load({ url }) {
export const load: LayoutServerLoad = ({ url }) => {
    const { searchParams } = url;
    const errorCode = searchParams.get('code') || 500
    const errorMessage = searchParams.get('msg') || "Something went wrong"
    throw error(errorCode, errorMessage);
}