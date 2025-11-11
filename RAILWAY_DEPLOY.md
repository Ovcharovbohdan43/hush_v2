# Railway deployment guide

## Проблема
Railway пытается собрать весь проект (включая frontend расширение), но нужно деплоить только Rust сервер.

## Решение

### Вариант 1: Использовать railway.json (рекомендуется)

Создан файл `railway.json` в корне проекта, который указывает Railway:
- Собирать только папку `server/`
- Использовать команду `cargo build --release`
- Запускать `cargo run --release`

### Вариант 2: Использовать Dockerfile

Создан файл `server/Dockerfile` для сборки Docker образа.

### Вариант 3: Настроить в Railway UI

1. В Railway проекте:
   - Settings → Service Settings
   - Root Directory: `server`
   - Build Command: `cargo build --release`
   - Start Command: `cargo run --release`

## Шаги деплоя на Railway

1. **Создайте проект в Railway:**
   - Зайдите на https://railway.app/
   - New Project → Deploy from GitHub repo
   - Выберите ваш репозиторий

2. **Настройте сервис:**
   - Railway должен автоматически определить Rust проект
   - Если нет - укажите Root Directory: `server`

3. **Добавьте переменные окружения:**
   - `DATABASE_URL` - строка подключения к PostgreSQL
   - `PORT` - порт (Railway установит автоматически)
   - `JWT_SECRET` - секретный ключ для JWT
   - `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD` - настройки SMTP
   - `SMTP_FROM` - адрес отправителя
   - `HUSH_DOMAIN` - домен для алиасов
   - `API_BASE_URL` - URL вашего Railway сервиса (например: `https://your-project.railway.app`)
   - `WEBHOOK_SECURITY_ENABLED=false` - для тестирования

4. **Добавьте PostgreSQL базу данных:**
   - В Railway проекте: New → Database → PostgreSQL
   - Railway автоматически создаст переменную `DATABASE_URL`

5. **Получите публичный URL:**
   - Railway автоматически создаст публичный URL
   - Например: `https://hush-server-production.up.railway.app`

6. **Настройте webhook в Brevo:**
   - URL: `https://your-railway-url.railway.app/api/v1/incoming/brevo`

## Проверка

После деплоя проверьте:
```bash
curl https://your-railway-url.railway.app/health
```

Должен вернуть: `OK`

## Важно

- Убедитесь, что все переменные окружения добавлены
- `API_BASE_URL` должен быть публичным URL Railway сервиса
- `DATABASE_URL` будет автоматически установлен Railway при добавлении PostgreSQL

