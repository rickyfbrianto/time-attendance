ARG NODE_VERSION="23-alpine"
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

COPY package.json /app

RUN cd /app && npm install && \
    echo "" 

COPY . .

RUN npm run build

# --- Stage 2: Run ---

# FROM node:${NODE_VERSION}

# WORKDIR /app

# COPY --from=builder /app/build .

# COPY package*.json .

# RUN npm install --omit=dev

# EXPOSE 9000

# CMD ['node', 'index.js']