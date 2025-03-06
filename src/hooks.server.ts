import { sequence } from '@sveltejs/kit/hooks';
// import { handle as authHandle } from './hooks/auth.server.js';
import { handle as adminHandle } from '@lib/hooks/admin.server.js';
import { redirect } from '@sveltejs/kit';

// export const handle = sequence(
//   authHandle,   // Jalankan hook autentikasi terlebih dahulu
//   adminHandle   // Kemudian jalankan hook admin
// );
