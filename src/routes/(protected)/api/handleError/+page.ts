import { error } from '@sveltejs/kit';

export function load({ url }) {
    const { searchParams } = url;
    const errorCode = searchParams.get('code') || 500
    const errorMessage = searchParams.get('msg') || "Something went wrong"
    throw error(errorCode, errorMessage);
}