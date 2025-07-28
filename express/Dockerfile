FROM node:24-alpine

WORKDIR /app

RUN apk update && apk add nano && npm i -g pnpm 

COPY package.json .

RUN pnpm install

COPY . .

EXPOSE 1111

CMD ["pnpm", "start"]