# Быстрый старт с Supabase

## 1. Создайте файл `.env`

В директории `server/` создайте файл `.env`:

```env
DATABASE_URL=postgresql://postgres:0990610146Ss@db.zxxxcsbnznakkettqvsw.supabase.co:5432/postgres?sslmode=require
PORT=3001
API_BASE_URL=http://localhost:3001
JWT_SECRET=your-secret-key-change-in-production-min-32-chars-please-change-this
JWT_EXPIRES_IN=3600
REFRESH_TOKEN_EXPIRES_IN=604800
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@hush.example
HUSH_DOMAIN=hush.example
```

**Важно**: Добавьте `?sslmode=require` к DATABASE_URL для Supabase.

## 2. Установите зависимости

```bash
cd server
cargo build
```

## 3. Запустите сервер

```bash
cargo run
```

## 4. Проверьте работу

```bash
# Health check
curl http://localhost:3001/health
```

Должен вернуть: `OK`

## Если возникнут проблемы

### Проблема с SSL
Если получите ошибку SSL, убедитесь что в DATABASE_URL есть `?sslmode=require`:
```
DATABASE_URL=postgresql://...?sslmode=require
```

### Проблема с расширением uuid-ossp
Выполните в Supabase SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Проблема с миграциями
Если миграции не запускаются автоматически, скопируйте содержимое `migrations/001_initial_schema.sql` и выполните в Supabase SQL Editor.

## Следующие шаги

1. Измените `JWT_SECRET` на случайную строку минимум 32 символа
2. Настройте SMTP параметры для отправки email
3. Измените `HUSH_DOMAIN` на ваш реальный домен
4. Протестируйте API endpoints (см. `API_EXAMPLES.md`)

## Документация

- `README.md` - основная документация
- `API_EXAMPLES.md` - примеры использования API
- `SUPABASE_SETUP.md` - детальная настройка Supabase
- `ENV_SETUP.md` - настройка переменных окружения

