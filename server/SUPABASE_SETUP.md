# Настройка для Supabase

## Подключение к Supabase PostgreSQL

Ваши данные подключения:
- **Host**: db.zxxxcsbnznakkettqvsw.supabase.co
- **Port**: 5432
- **Database**: postgres
- **User**: postgres
- **Password**: 0990610146Ss

## Шаги настройки

### 1. Создайте файл `.env`

В директории `server/` создайте файл `.env` (см. `ENV_SETUP.md` для полного содержимого).

### 2. Проверка расширений в Supabase

Supabase обычно уже имеет расширение `uuid-ossp`, но если миграция выдаст ошибку, выполните в Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 3. Запуск миграций

Миграции запустятся автоматически при первом запуске сервера. Если нужно запустить вручную через Supabase SQL Editor, скопируйте содержимое `migrations/001_initial_schema.sql`.

### 4. Проверка подключения

```bash
cd server
cargo run
```

Ожидаемый вывод:
```
Database connection established
Database migrations completed
Server starting on http://0.0.0.0:3001
```

## Возможные проблемы

### Проблема: "extension uuid-ossp does not exist"

**Решение**: Выполните в Supabase SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Проблема: "permission denied for schema public"

**Решение**: Supabase может требовать права. Проверьте, что пользователь `postgres` имеет необходимые права, или используйте Supabase SQL Editor для создания таблиц вручную.

### Проблема: SSL connection required

**Решение**: Добавьте `?sslmode=require` к DATABASE_URL:
```
DATABASE_URL=postgresql://postgres:0990610146Ss@db.zxxxcsbnznakkettqvsw.supabase.co:5432/postgres?sslmode=require
```

## Проверка работы

После запуска сервера проверьте:

```bash
# Health check
curl http://localhost:3001/health
# Должен вернуть: OK
```

## Безопасность

⚠️ **ВАЖНО**: 
- Не коммитьте `.env` файл в git
- Измените `JWT_SECRET` на случайную строку минимум 32 символа
- Используйте сильные пароли в production

