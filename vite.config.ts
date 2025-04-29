import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
    server:{
        port: 1100,
        host: "0.0.0.0",
        allowedHosts: ['ricky'],
        fs: {
            allow: [
                "C:/Users/RICKY/Desktop/time-attendance/static/media/attach_signature/"
            ]
        }
    },
    preview:{
        port: 1000,
        allowedHosts: ['ricky.dev', 'ricky'],
    },
    resolve: {
        alias: {
            ".prisma/client/index-browser": "./node_modules/.prisma/client/index-browser.js",
        }
    },
});
