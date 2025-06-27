FROM node:24-alpine

RUN apk update && apk add nano

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml .

RUN pnpm install

EXPOSE ${PORT_EXPRESS}

CMD ['pnpm','run','start']