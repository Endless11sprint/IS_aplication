FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm i --no-audit --no-fund

FROM node:24-alpine AS build
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate --schema=prisma/schema.prisma
RUN npm run build
# Оставляем только runtime-зависимости
RUN npm prune --omit=dev

FROM node:24-alpine AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps  /app/node_modules ./node_modules
COPY . .
CMD ["sh","-lc","npx prisma generate --schema=prisma/schema.prisma && npx prisma migrate deploy || true; node --loader ts-node/esm src/server.ts"]

FROM node:24-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist         ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src/generated/prisma ./dist/generated/prisma

USER node
EXPOSE 3000
CMD ["sh","-lc","npx prisma migrate deploy --schema=prisma/schema.prisma && node dist/server.js"]