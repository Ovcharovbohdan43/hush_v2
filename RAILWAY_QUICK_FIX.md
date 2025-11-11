# Railway deployment - Quick Fix

## Проблема
Railway пытается собрать весь проект вместо только сервера.

## Решение

### В Railway UI:

1. **Settings → Service Settings:**
   - **Root Directory:** `server`
   - **Build Command:** оставьте пустым (Railway определит Rust автоматически)
   - **Start Command:** оставьте пустым

2. **Или используйте Nixpacks:**
   - Railway автоматически определит Rust проект в папке `server/`
   - Просто укажите Root Directory: `server`

### Альтернатива: Используйте Dockerfile

Если Railway не определяет Rust автоматически:
- Используйте созданный `server/Dockerfile`
- В Railway: Settings → Deploy → Dockerfile Path: `server/Dockerfile`

## Быстрый способ:

1. В Railway проекте нажмите на ваш сервис
2. Settings → Service Settings
3. **Root Directory:** `server`
4. Сохраните
5. Railway пересоберет проект автоматически

## Переменные окружения:

Добавьте в Railway:
- `DATABASE_URL` (автоматически при добавлении PostgreSQL)
- `PORT` (автоматически)
- `JWT_SECRET`
- `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD`
- `SMTP_FROM`
- `HUSH_DOMAIN`
- `API_BASE_URL` = ваш Railway URL
- `WEBHOOK_SECURITY_ENABLED=false`

