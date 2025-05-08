ARG NODE_VERSION="23-alpine"
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

COPY . .

RUN npm install

RUN npm run build

# --- Stage 2: Run ---
FROM node:${NODE_VERSION}

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
RUN npm install --omit=dev

COPY --from=builder /app/build ./build

# (Opsional) Salin konfigurasi lain jika dibutuhkan
# COPY --from=builder /app/.env .env

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "build"]