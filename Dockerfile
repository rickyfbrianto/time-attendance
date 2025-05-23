FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

# Build aplikasi
RUN npm run build

# === Production Stage ===
FROM node:20-alpine

WORKDIR /app

# Salin hanya yang diperlukan
COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production

EXPOSE 3000

# Jalankan aplikasi Node dari adapter-node
CMD ["node", "build"]