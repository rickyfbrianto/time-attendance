// import { redirect } from '@sveltejs/kit';
// import { verifyToken } from '$lib/auth.server.js';

// export async function handle({ event, resolve }) {
//   // Ambil token dari cookies
//   const token = event.cookies.get('token');

//   // Route publik untuk autentikasi
//   const publicAuthPaths = [
//     '/login', 
//     '/register', 
//     '/forgot-password'
//   ];

//   // Cek apakah route saat ini adalah route publik autentikasi
//   const isPublicAuthPath = publicAuthPaths.some(path => 
//     event.url.pathname.startsWith(path)
//   );

//   // Jika route autentikasi, lakukan pengecekan
//   if (isPublicAuthPath) {
//     // Jika sudah login dan mengakses halaman login, redirect ke dashboard
//     if (token && verifyToken(token)) {
//       throw redirect(302, '/dashboard');
//     }
//   }

//   // Lanjutkan ke proses resolve
//   return resolve(event);
// }