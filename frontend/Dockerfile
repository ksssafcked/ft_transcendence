FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.client.json ./
COPY tsconfig.server.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

RUN npm install

COPY src ./src

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
