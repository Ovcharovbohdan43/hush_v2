# Инструкции по настройке Hush V2 Server

## Готовность проекта

✅ Все основные компоненты реализованы:
- Структура проекта создана
- База данных и миграции готовы
- API endpoints реализованы
- Аутентификация настроена
- Документация создана

## Следующие шаги для запуска

### 1. Установка зависимостей

```bash
cd server
cargo build
```

### 2. Настройка базы данных PostgreSQL

```bash
# Создать базу данных
createdb hush

# Или через psql:
psql -U postgres
CREATE DATABASE hush;
\q
```

### 3. Создание файла .env

Создайте файл `.env` в директории `server/` со следующим содержимым:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hush

# Server
PORT=3001
API_BASE_URL=http://localhost:3001

# JWT (ВАЖНО: измените на случайную строку минимум 32 символа!)
JWT_SECRET=your-secret-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=3600
REFRESH_TOKEN_EXPIRES_IN=604800

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@hush.example

# Domain
HUSH_DOMAIN=hush.example
```

### 4. Запуск сервера

```bash
cargo run
```

Сервер запустится на `http://localhost:3001`

### 5. Проверка работоспособности

```bash
# Проверка health endpoint
curl http://localhost:3001/health
# Должен вернуть: OK
```

## Готовность к получению реальных данных

Проект готов к получению реальных данных для:
- ✅ DATABASE_URL - строка подключения к PostgreSQL
- ✅ SMTP настройки - для отправки email верификации
- ✅ JWT_SECRET - секретный ключ для токенов
- ✅ HUSH_DOMAIN - домен для алиасов
- ✅ API_BASE_URL - базовый URL API

Все эти значения можно будет обновить в файле `.env` после получения реальных данных.

## Структура API

Все endpoints готовы и документированы в `README.md`:
- `/api/v1/auth/*` - аутентификация
- `/api/v1/aliases/*` - управление алиасами
- `/api/v1/targets/*` - управление целевым email
- `/api/v1/notifications/*` - уведомления

## Примечания

- Миграции запускаются автоматически при старте сервера
- Все защищенные endpoints требуют Bearer token в заголовке Authorization
- CORS настроен для работы с расширением (можно будет ограничить конкретным origin)

