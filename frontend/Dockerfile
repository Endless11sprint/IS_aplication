FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:24-alpine AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Копируем остальной код
COPY . .
# Открываем порт dev-сервера
EXPOSE 5173
# Запускаем Vite
CMD ["npm","run","dev"]

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM nginx:1.29-alpine AS prod
# Замена стандартного конфига NGINX
RUN rm -f /etc/nginx/conf.d/default.conf
COPY ./nginx/nginx.conf /etc/nginx/conf.d/app.conf
# Копируем результаты сборки
COPY --from=build /app/dist/ /usr/share/nginx/html/
EXPOSE 80