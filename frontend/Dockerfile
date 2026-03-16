# syntax=docker/dockerfile:1.7

# Аргументы для определения режима (production по умолчанию)
ARG APP_MODE=production
ARG USE_MOCK_DATA=false

FROM node:20-alpine AS build
WORKDIR /app

# Устанавливаем переменные для сборки
ENV VITE_APP_MODE=${APP_MODE}
ENV VITE_USE_MOCK_DATA=${USE_MOCK_DATA}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx/frontend.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
