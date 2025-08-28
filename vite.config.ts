import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from "node:path";
import { enhancedImages } from '@sveltejs/enhanced-img';

export default defineConfig({
    optimizeDeps: {
        exclude: ['@prisma-app/client/runtime']
    },
    plugins: [
        enhancedImages(),
        tailwindcss(),
        sveltekit(),
    ],
    server: {
        port: 1100,
        host: "0.0.0.0",
        allowedHosts: ['sagaweb', 'ricky', "it", 'time-app'],
    },
    preview: {
        port: 1000,
        allowedHosts: ['sagaweb', 'ricky', "it", 'time-app'],
    },
    resolve: {
        alias: {
            ".prisma/client/index-browser": "./node_modules/.prisma/client/index-browser.js",
            // "@prisma-app/client": path.resolve(__dirname, 'node_modules/.prisma/client'),
        }
    },
});
