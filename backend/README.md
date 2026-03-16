# Personal Finance Manager - Backend API

## Содержание

- [Обзор](#обзор)
- [Технологии](#технологии)
- [Установка и запуск](#установка-запуск)
- [Конфигурация](#конфигурация)
- [Защита от DDoS](#защита-от-ddos)
- [API Endpoints](#api-endpoints)
  - [Аутентификация](#аутентификация)
  - [Счета](#счета)
  - [Транзакции](#транзакции)
  - [Бюджет](#бюджет)
  - [Долги](#долги)
  - [Кредиты](#кредиты)
  - [Валюты](#валюты)
  - [Уведомления](#уведомления)
  - [Аналитика](#аналитика)
  - [Семейная группа](#семейная-группа)
- [Рабочие пространства](#рабочие-пространства)

---

## Обзор

Backend API для персонального финансового менеджера. Обеспечивает управление счетами, транзакциями, бюджетами, долгами, кредитами и семейными группами.

## Технологии

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** TypeORM
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcrypt

## Установка и запуск

### Локальная разработка

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка и запуск
npm run build
npm start
```

### Docker

```bash
# Запуск через docker-compose
docker-compose up -d
```

---

## Конфигурация

Переменные окружения (см. `.env.example`):

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `PORT` | Порт сервера | `8080` |
| `DB_HOST` | Хост базы данных | `localhost` |
| `DB_PORT` | Порт базы данных | `5432` |
| `DB_NAME` | Имя базы данных | `pfm` |
| `DB_USERNAME` | Имя пользователя БД | `postgres` |
| `DB_PASSWORD` | Пароль БД | `postgres` |
| `JWT_SECRET` | Секретный ключ JWT | `your-secret-key` |

---

## Защита от DDoS

Backend имеет встроенную защиту от DDoS атак:

- **Лимит:** 100 запросов за 15 минут
- **Блокировка:** 30 минут при превышении лимита
- **Сброс:** автоматически через 1 час после разблокировки

При блокировке сервер возвращает:
```json
{
  "error": "Too Many Requests",
  "message": "Превышен лимит запросов. Вы заблокированы на 30 минут",
  "blockedUntil": "2026-03-16T14:02:00.000Z"
}
```

Заголовки ответа:
- `X-RateLimit-Limit` - максимальное количество запросов
- `X-RateLimit-Remaining` - оставшиеся запросы
- `X-RateLimit-Reset` - время сброса лимита

---

## API Endpoints

### Аутентификация

Базовый URL: `/api/auth`

| Метод | Путь | Описание | Тип |
|-------|------|----------|-----|
| POST | `/register` | Регистрация нового пользователя | Public |
| POST | `/login` | Вход в систему | Public |
| POST | `/logout` | Выход из системы | Protected |
| POST | `/verify-password` | Проверка пароля | Protected |
| POST | `/change-password` | Смена пароля | Protected |

**Регистрация - POST /api/auth/register**
```json
// Request
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "Иван",
  "lastName": "Петров"
}

// Response
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "Иван",
      "lastName": "Петров"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Вход - POST /api/auth/login**
```json
// Request
{
  "email": "user@example.com",
  "password": "securePassword123"
}

// Response
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Счета

Базовый URL: `/api/accounts`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/` | Получить все счета |
| GET | `/currencies` | Получить используемые валюты |
| POST | `/` | Создать счёт |
| GET | `/:id` | Получить счёт по ID |
| PUT | `/:id` | Обновить счёт |
| DELETE | `/:id` | Удалить счёт |

**Создание счёта - POST /api/accounts**
```json
// Request
{
  "name": "Наличные",
  "balance": 1000,
  "type": "CASH",
  "currency": "UZS",
  "includedInBalance": true,
  "workspace": "personal" // или "family"
}
```

---

### Транзакции

Базовый URL: `/api/transactions`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/` | Получить все транзакции |
| POST | `/` | Создать транзакцию |
| PUT | `/:id` | Обновить транзакцию |
| DELETE | `/:id` | Удалить транзакцию |

**Параметры запроса (GET):**
- `startDate` - начальная дата (YYYY-MM-DD)
- `endDate` - конечная дата (YYYY-MM-DD)
- `type` - тип транзакции (INCOME, EXPENSE, TRANSFER)
- `accountId` - ID счёта
- `workspace` - рабочее пространство (personal/family)

**Создание транзакции - POST /api/transactions**
```json
// Request - Доход
{
  "amount": 50000,
  "description": "Зарплата",
  "date": "2026-03-16",
  "type": "INCOME",
  "category": "Зарплата",
  "accountId": 1,
  "currency": "UZS"
}

// Request - Расход
{
  "amount": 15000,
  "description": "Продукты",
  "date": "2026-03-16",
  "type": "EXPENSE",
  "category": "Продукты",
  "accountId": 1,
  "currency": "UZS"
}

// Request - Перевод
{
  "amount": 10000,
  "description": "Перевод на карту",
  "date": "2026-03-16",
  "type": "TRANSFER",
  "accountId": 1,
  "toAccountId": 2,
  "toAmount": 10000,
  "currency": "UZS",
  "toCurrency": "USD"
}
```

---

### Бюджет

Базовый URL: `/api/budgets`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/` | Получить все бюджеты |
| GET | `/by-month` | Бюджет за месяц |
| POST | `/` | Создать бюджет |
| GET | `/summary/:monthKey` | Сводка бюджета |
| PUT | `/:id` | Обновить бюджет |
| DELETE | `/:id` | Удалить бюджет |
| POST | `/:id/category-limits` | Добавить лимит категории |
| PUT | `/:id/category-limits/:category` | Обновить лимит |
| DELETE | `/:id/category-limits/:category` | Удалить лимит |

**Параметры:**
- `monthKey` - ключ месяца (YYYY-MM)
- `accountId` - ID счёта (опционально)

**Создание бюджета - POST /api/budgets**
```json
// Request
{
  "monthKey": "2026-03",
  "accountId": null,
  "totalIncomePlan": 50000,
  "totalExpensePlan": 30000,
  "categoryLimits": [
    { "category": "Продукты", "limitAmount": 10000 },
    { "category": "Транспорт", "limitAmount": 5000 }
  ],
  "incomePlanItems": [
    { "category": "Зарплата", "plannedAmount": 50000 }
  ]
}
```

---

### Долги

Базовый URL: `/api/debts`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/` | Получить все долги |
| POST | `/` | Создать долг |
| PUT | `/:id` | Обновить долг |
| DELETE | `/:id` | Удалить долг |

**Типы долгов:**
- `owe` - должны вам
- `owed` - вы должны

**Статусы:**
- `open` - открыт
- `closed` - закрыт

**Создание долга - POST /api/debts**
```json
// Request
{
  "name": "Долг за аренду",
  "amount": 200,
  "creditor": "Арендодатель",
  "dueDate": "2026-04-01",
  "notes": "Оплатить до 1 апреля",
  "currency": "USD",
  "type": "owed",
  "status": "open",
  "workspace": "personal"
}
```

---

### Кредиты

Базовый URL: `/api/credits`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/` | Получить все кредиты |
| POST | `/` | Создать кредит |
| PUT | `/:id` | Обновить кредит |
| DELETE | `/:id` | Удалить кредит |

**Типы кредитов:**
- `credit` - кредитная карта
- `loan` - потребительский кредит
- `mortgage` - ипотека
- `auto` - автокредит

**Создание кредита - POST /api/credits**
```json
// Request
{
  "name": "Кредитная карта",
  "totalAmount": 1000,
  "currency": "USD",
  "kind": "credit",
  "startDate": "2026-01-01",
  "endDate": "2027-01-01",
  "months": 12,
  "paidAmount": 0,
  "paidInstallments": 0,
  "status": "active",
  "notes": "Кредит наличными"
}
```

---

### Валюты

Базовый URL: `/api/exchange-rates`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/` | Получить все курсы валют |
| GET | `/currencies` | Получить список валют |
| GET | `/convert` | Конвертировать валюту |
| POST | `/` | Создать/обновить курс |

**Конвертация - GET /api/exchange-rates/convert**
```
/api/exchange-rates/convert?from=USD&to=UZS&amount=100
```

```json
// Response
{
  "success": true,
  "data": {
    "convertedAmount": 12500
  }
}
```

**Создание курса - POST /api/exchange-rates**
```json
// Request
{
  "fromCurrency": "USD",
  "toCurrency": "UZS",
  "rate": 12500
}
```

---

### Уведомления

Базовый URL: `/api/notifications`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/` | Получить все уведомления |
| POST | `/` | Создать уведомление |
| PUT | `/:id/read` | Отметить как прочитанное |
| DELETE | `/:id` | Удалить уведомление |

**Типы уведомлений:**
- `info` - информационное
- `success` - успех
- `warning` - предупреждение
- `error` - ошибка
- `family_request` - запрос семьи

---

### Аналитика

Базовый URL: `/api/analytics`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/summary` | Общая сводка |
| GET | `/by-category` | По категориям |
| GET | `/accounts-summary` | Сводка по счетам |

**Параметры:**
- `startDate` - начальная дата
- `endDate` - конечная дата

**Сводка - GET /api/analytics/summary**
```json
// Response
{
  "success": true,
  "data": {
    "totalIncome": 50000,
    "totalExpenses": 25000,
    "balance": 25000
  }
}
```

**По категориям - GET /api/analytics/by-category**
```json
// Response
{
  "success": true,
  "data": {
    "Продукты": 15000,
    "Транспорт": 5000,
    "Развлечения": 5000
  }
}
```

---

### Семейная группа

Базовый URL: `/api/family-requests`

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/create-group` | Создать группу |
| POST | `/join-group` | Присоединиться к группе |
| GET | `/status` | Статус группы |
| GET | `/incoming-requests` | Входящие запросы |
| PUT | `/requests/:id/accept` | Принять запрос |
| PUT | `/requests/:id/decline` | Отклонить запрос |
| POST | `/invite-by-email` | Пригласить по email |
| DELETE | `/members/:memberId` | Удалить участника |
| PUT | `/transfer-leadership/:newLeaderId` | Передать лидерство |
| POST | `/leave` | Покинуть группу |
| DELETE | `/requests/:id/cancel` | Отменить запрос |

**Создание группы - POST /api/family-requests/create-group**
```json
// Request
{
  "name": "Семья Ивановых"
}

// Response
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Семья Ивановых",
    "leaderId": 1,
    "inviteCode": "ABC12345",
    "isLeader": true,
    "isInGroup": true,
    "members": [...]
  }
}
```

**Присоединение к группе - POST /api/family-requests/join-group**
```json
// Request
{
  "inviteCode": "ABC12345"
}
```

**Статус группы - GET /api/family-requests/status**
```json
// Response
{
  "success": true,
  "data": {
    "isInGroup": true,
    "isLeader": true,
    "groupName": "Семья Ивановых",
    "groupId": 1,
    "inviteCode": "ABC12345",
    "members": [
      {
        "id": 1,
        "name": "Иван Петров",
        "email": "ivan@example.com",
        "avatar": "И",
        "isLeader": true
      }
    ]
  }
}
```

---

## Рабочие пространства

API поддерживает два режима работы:

1. **Personal** (по умолчанию) - личные данные пользователя
2. **Family** - семейная группа (доступно для участников группы)

Для использования Family workspace добавьте параметр:
- В query string: `?workspace=family`
- В body запроста: `"workspace": "family"`

---

## Response Format

Все ответы имеют единый формат:

**Успешный ответ:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Ответ с сообщением:**
```json
{
  "success": true,
  "message": "Операция выполнена успешно"
}
```

**Ошибка:**
```json
{
  "success": false,
  "error": "Сообщение об ошибке",
  "message": "Детали ошибки"
}
```

**Коды ошибок:**
- `400` - Bad Request (неверный запрос)
- `401` - Unauthorized (не авторизован)
- `403` - Forbidden (доступ запрещён)
- `404` - Not Found (не найдено)
- `429` - Too Many Requests (превышен лимит)
- `500` - Internal Server Error (ошибка сервера)

---

## Аутентификация

Все защищённые endpoints требуют заголовок `Authorization`:

```
Authorization: Bearer <token>
```

Токен получается при регистрации или входе и действует 7 дней.

---

## Лицензия

MIT
