FROM node:20-slim AS base

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

CMD ["npm", "run", "ingest"]
