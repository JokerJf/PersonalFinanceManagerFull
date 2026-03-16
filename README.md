# Personal Finance Manager

Веб-приложение для управления личными финансами с поддержкой семейных групп.

## Содержание

- [Возможности](#возможности)
- [Требования](#требования)
- [Быстрый старт](#быстрый-старт)
- [Конфигурация](#конфигурация)
- [Запуск](#запуск)
- [Структура проекта](#структура-проекта)
- [Сервисы](#сервисы)
- [Переменные окружения](#переменные-окружения)
- [Разработка](#разработка)

---

## Возможности

- 📊 **Управление счетами** - наличные, карты, счета в банках
- 💰 **Транзакции** - доходы, расходы, переводы между счетами
- 📈 **Бюджетирование** - планирование доходов и расходов по категориям
- 💳 **Кредиты** - отслеживание кредитов и платежей
- 📋 **Долги** - управление должниками и долгами
- 💱 **Валюты** - курсы валют и конвертация
- 📊 **Аналитика** - сводки и статистика по финансам
- 👨‍👩‍👧‍👦 **Семейные группы** - совместное управление финансами
- 🔒 **Защита от DDoS** - встроенная защита от атак

---

## Требования

- [Docker](https://www.docker.com/) версии 20.10+
- [Docker Compose](https://docs.docker.com/compose/) версии 2.0+

---

## Быстрый старт

1. **Клонируйте репозиторий:**
```bash
git clone <repository-url>
cd PersonalFinanceManager-frontend
```

2. **Скопируйте файл переменных окружения:**
```bash
# Для Linux/Mac
cp .env.example .env

# Для Windows
copy .env.example .env
```

3. **Отредактируйте `.env` файл** (см. раздел [Переменные окружения](#переменные-окружения))

4. **Запустите проект:**
```bash
docker-compose up -d
```

5. **Откройте в браузере:**
- Frontend: http://localhost
- Adminer (управление БД): http://localhost:8081
- Backend API: http://localhost/api

---

## Конфигурация

### Файлы .env

Проект использует следующие `.env` файлы:

| Файл | Назначение |
|------|------------|
| `.env` | Основные переменные (Docker Compose) |
| `backend/.env` | Переменные бэкенда |
| `frontend/.env` | Переменные фронтенда |

### Создание .env файлов

```bash
# Основной файл (корневой)
cp .env.example .env

# Backend
cd backend
cp .env.example .env
cd ..

# Frontend  
cd frontend
cp .env.example .env
cd ..
```

---

## Запуск

### Основные команды

```bash
# Запуск всех сервисов
docker-compose up -d

# Запуск с пересборкой
docker-compose up -d --build

# Просмотр логов
docker-compose logs -f

# Остановка всех сервисов
docker-compose down

# Остановка с удалением томов
docker-compose down -v
```

### Запуск отдельных сервисов

```bash
# Только база данных
docker-compose up -d db

# База данных + бэкенд
docker-compose up -d db backend

# С определёнными сервисами
docker-compose up -d db backend nginx
```

---

## Структура проекта

```
PersonalFinanceManager-frontend/
├── docker-compose.yml          # Оркестрация Docker
├── .env.example                # Шаблон переменных окружения
├── nginx/                      # Конфигурация Nginx
│   ├── nginx.conf
│   └── frontend.conf
├── backend/                    # Backend API
│   ├── src/
│   │   ├── index.ts           # Точка входа
│   │   ├── routes/            # API endpoints
│   │   ├── entity/            # Модели данных
│   │   ├── middleware/        # Промежуточное ПО
│   │   └── utils/             # Утилиты
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
└── frontend/                   # Frontend приложение
    ├── src/
    │   ├── pages/              # Страницы
    │   ├── components/         # Компоненты
    │   ├── api/                 # API клиент
    │   ├── hooks/               # React хуки
    │   └── context/             # Контекст React
    ├── nginx/
    ├── Dockerfile
    ├── package.json
    └── .env.example
```

---

## Сервисы

| Сервис | Порт | Описание |
|--------|------|----------|
| `db` | 5432 | PostgreSQL база данных |
| `backend` | 8080 | Node.js API сервер |
| `frontend` | 80 | React приложение |
| `nginx` | 80 | Обратный прокси |
| `adminer` | 8081 | Управление базой данных |

---

## Переменные окружения

### Основные (.env в корне проекта)

```bash
# ===========================================
# DATABASE CONFIGURATION - База данных
# ===========================================
POSTGRES_DB=pfm                    # Имя базы данных
POSTGRES_USER=postgres              # Пользователь БД
POSTGRES_PASSWORD=your_secure_password_here  # Пароль БД

# ===========================================
# BACKEND CONFIGURATION - Бэкенд
# ===========================================
DB_HOST=db                         # Хост базы данных (для Docker - 'db')
DB_PORT=5432                       # Порт базы данных
DB_NAME=pfm                        # Имя базы данных
DB_USERNAME=postgres               # Пользователь БД
DB_PASSWORD=your_secure_password_here  # Пароль БД

JWT_SECRET=generate_a_secure_random_secret_key_here  # Секретный ключ JWT
SPRING_PROFILES_ACTIVE=docker      # Профиль запуска

ADMINER_PORT=8081                  # Порт для Adminer

# ===========================================
# FRONTEND CONFIGURATION - Фронтенд
# ===========================================
APP_MODE=production                # Режим: production или development
USE_MOCK_DATA=false                # Использовать моковые данные
FRONTEND_PORT=80                   # Порт фронтенда (по умолчанию 80)
BACKEND_PORT=8080                  # Порт бэкенда
DB_EXTERNAL_PORT=5432              # Внешний порт БД
```

### Backend (backend/.env)

```bash
# ===========================================
# SERVER CONFIGURATION
# ===========================================
PORT=8080                          # Порт сервера
NODE_ENV=development               # Режим: development или production

# ===========================================
# DATABASE CONFIGURATION
# ===========================================
DB_HOST=localhost                  # Хост БД
DB_PORT=5432                       # Порт БД
DB_NAME=pfm                        # Имя БД
DB_USERNAME=postgres               # Пользователь БД
DB_PASSWORD=your_secure_password_here  # Пароль БД

# ===========================================
# JWT CONFIGURATION
# ===========================================
JWT_SECRET=your_jwt_secret_here   # Секретный ключ
JWT_EXPIRES_IN=3600                # Время жизни токена (сек)
JWT_REFRESH_EXPIRES_IN=604800      # Время жизни refresh токена

# ===========================================
# CORS CONFIGURATION
# ===========================================
CORS_ORIGIN=*                      # Разрешённые источники
```

### Frontend (frontend/.env)

```bash
# ===========================================
# APPLICATION MODE
# ===========================================
VITE_APP_MODE=development          # development | production

# ===========================================
# API CONFIGURATION
# ===========================================
VITE_API_BASE_URL=/api             # Базовый URL API

# ===========================================
# DEVELOPMENT OPTIONS
# ===========================================
VITE_USE_MOCK_DATA=true            # Использовать моковые данные
VITE_MOCK_DELAY=1000               # Задержка моков (мс)
```

### Важные замечания

1. **Пароли:** Обязательно измените `your_secure_password_here` на безопасный пароль

2. **JWT Secret:** Используйте сложный случайный ключ для JWT:
   ```bash
   # Пример генерации ключа (Linux/Mac)
   openssl rand -hex 64
   ```

3. **Режим Frontend:**
   - `development` - для разработки с моковыми данными
   - `production` - для продакшена с реальным API

4. **Порты:** Убедитесь, что порты 80, 5432, 8080, 8081 не заняты другими приложениями

---

## Разработка

### Локальная разработка (без Docker)

#### Backend

```bash
cd backend

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка
npm run build
```

#### Frontend

```bash
cd frontend

# Установка зависимостей (используется bun)
bun install

# Запуск dev сервера
bun run dev

# Сборка
bun run build
```

### Стек технологий

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express, TypeORM, PostgreSQL
- **Docker:** Nginx, Adminer
