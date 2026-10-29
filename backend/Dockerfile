FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache sqlite sqlite-dev build-base

COPY package*.json ./

RUN npm install && npm install @fastify/cors@8

RUN mkdir -p public/avatars

COPY src ./src
COPY data ./data
COPY init-db.sh ./
COPY public ./public


RUN chmod +x ./init-db.sh

EXPOSE 4000

CMD ["sh", "-c", "./init-db.sh && node src/server.js"]
