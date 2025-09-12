# Stage 1: Build
FROM node:24-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN echo "🔎 Debug DATABASE_URL=$DATABASE_URL"

RUN pnpm prisma generate
# RUN pnpm db

# === Production Stage ===
FROM node:24-alpine AS run

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

# ? Folder
COPY --from=builder /app/.svelte-kit ./.svelte-kit
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/static ./static

# File
COPY --from=builder /app/.npmrc ./.npmrc
COPY --from=builder /app/svelte.config.js ./svelte.config.js
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/vite.config.ts ./vite.config.ts

EXPOSE 1000

CMD ["npm", "run", "preview"]