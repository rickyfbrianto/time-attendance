# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

RUN apk update && npm i -g pnpm

COPY package.json ./

RUN pnpm install

COPY . .

RUN pnpx prisma generate

EXPOSE 1000

CMD ["pnpm","preview"]

# === Production Stage ===
# FROM node:20-alpine
# WORKDIR /app

# COPY package*.json ./
# RUN npm ci --omit=dev

# COPY --from=builder /app/build ./build
# # COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# # COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
# COPY --from=builder /app/node_modules/@prisma-app/client ./node_modules/@prisma-app/client
# COPY --from=builder /app/prisma ./prisma

# ENV NODE_ENV=production

# EXPOSE 1000

# # Jalankan aplikasi Node dari adapter-node
# CMD ["node", "build"]