import { sequence } from '@sveltejs/kit/hooks';
import { handle as authHandle } from '$/lib/hooks/auth.server.js';
import { handle as authAPI } from '$/lib/hooks/api.server.js';
import type { Handle } from '@sveltejs/kit';

export const handle = sequence(
    authHandle,
    authAPI,
);