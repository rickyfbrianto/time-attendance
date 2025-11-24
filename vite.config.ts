import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    optimizeDeps: {
        exclude: ['@prisma-app/client/runtime']
    },
    plugins: [
        tailwindcss(),
        sveltekit(),
    ],
    build: {
        sourcemap: true
    },
    server: {
        port: 1100,
        host: "0.0.0.0",
        allowedHosts: ['sagaweb', 'ricky', 'time-app'], // ? time-app adalah instance docker
    },
    preview: {
        port: 1000,
        allowedHosts: ['sagaweb', 'ricky', 'time-app'], // ? time-app adalah instance docker
    },
    resolve: {
        alias: {
            ".prisma/client/index-browser": "./node_modules/.prisma/client/index-browser.js",
            // "@prisma-app/client": path.resolve(__dirname, 'node_modules/.prisma/client'),
        }
    },
});
