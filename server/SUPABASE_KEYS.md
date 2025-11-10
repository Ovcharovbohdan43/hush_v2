# Supabase Keys и Configuration

## Supabase Project Information

- **Project URL**: https://zxxxcsbnznakkettqvsw.supabase.co
- **Database Host**: db.zxxxcsbnznakkettqvsw.supabase.co
- **Database Port**: 5432
- **Database Name**: postgres
- **Database User**: postgres
- **Database Password**: 0990610146Ss

## API Keys

### Anon Key (Public)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4eHhjc2Juem5ha2tldHRxdnN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjE0MzEsImV4cCI6MjA3ODI5NzQzMX0.FWUzz5W58mXesblHnRPxhXP68dAobwC1tloYO8K_RKQ
```

### Service Role Key (Admin)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4eHhjc2Juem5ha2tldHRxdnN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjE0MzEsImV4cCI6MjA3ODI5NzQzMX0.FWUzz5W58mXesblHnRPxhXP68dAobwC1tloYO8K_RKQ
```

**Примечание**: Service Role Key должен отличаться от Anon Key. Если они одинаковые, проверьте правильность ключа в Supabase Dashboard → Settings → API.

## Database Connection String

```
postgresql://postgres:0990610146Ss@db.zxxxcsbnznakkettqvsw.supabase.co:5432/postgres?sslmode=require
```

## Использование

### Для прямого подключения к PostgreSQL (текущий сервер)
Используйте `DATABASE_URL` в `.env` файле. Ключи API не нужны для прямого подключения.

### Для Supabase REST API (будущая интеграция)
Если в будущем понадобится использовать Supabase REST API, используйте:
- **Anon Key** для публичных запросов
- **Service Role Key** для административных запросов (с обходом RLS)

## Безопасность

⚠️ **ВАЖНО**:
- Service Role Key имеет полный доступ к базе данных и обходит RLS (Row Level Security)
- Никогда не используйте Service Role Key в клиентском коде
- Храните ключи в безопасном месте (`.env` файл, не коммитьте в git)
- Anon Key можно использовать в клиентском коде, но с осторожностью

## Текущая конфигурация

Наш сервер использует прямое подключение к PostgreSQL через SQLx, поэтому API ключи Supabase не требуются. Они могут быть полезны в будущем для:
- Интеграции с Supabase Auth
- Использования Supabase Storage
- Supabase Realtime subscriptions

