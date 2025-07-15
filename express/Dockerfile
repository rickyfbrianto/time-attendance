FROM node:24-alpine

WORKDIR /app

RUN apk update && apk add nano && npm install -g pnpm

COPY package.json pnpm-lock.yaml .

RUN pnpm install

COPY . .

EXPOSE 1111

CMD ["pnpm", "start"]