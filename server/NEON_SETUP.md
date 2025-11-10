# Neon Setup Guide

## 1. Создайте проект в Neon
1. Перейдите на [https://console.neon.tech](https://console.neon.tech) и создайте новый проект.
2. Сохраните:
   - Host (например, `ep-silent-glitter-ahvalyxw.us-east-1.aws.neon.tech`)
   - Имя базы данных (по умолчанию `neondb`)
   - Пользователя (например, `neondb_owner`)
   - Пароль пользователя
3. В настройках проекта включите опцию "Autosuspend" по желанию (для экономии кредитов).

## 2. Настройте `.env`
В директории `server/` создайте файл `.env`:

```env
DATABASE_URL=postgresql://<username>:<password>@ep-silent-glitter-ahvalyxw.us-east-1.aws.neon.tech/neondb?sslmode=require
PORT=3001
API_BASE_URL=http://localhost:3001
JWT_SECRET=<случайный_ключ_32+
символа>
JWT_EXPIRES_IN=3600
REFRESH_TOKEN_EXPIRES_IN=604800
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USERNAME=<smtp_login>
SMTP_PASSWORD=<smtp_password>
SMTP_FROM=noreply@hush.example
HUSH_DOMAIN=hush.example
# Необязательно
# NEON_REST_ENDPOINT=https://ep-silent-glitter-ahvalyxw.apirest.c-3.us-east-1.aws.neon.tech/neondb/rest/v1
# NEON_API_KEY=<api_key>
```

## 3. Проверка подключения
```powershell
psql "postgresql://<username>:<password>@ep-silent-glitter-ahvalyxw.us-east-1.aws.neon.tech/neondb?sslmode=require"
```
Если подключение не устанавливается:
- Проверьте правильность пользователя/пароля.
- Проверьте, что локальная машина имеет доступ в интернет (не блокируется VPN/Firewall).
- Убедитесь, что в `DATABASE_URL` есть `?sslmode=require`.

## 4. Запуск миграций
Миграции применяются автоматически при запуске сервера:
```powershell
cd server
cargo run
```
При успешной инициализации увидите:
```
Database connection established
Database migrations completed
Server starting on http://0.0.0.0:3001
```

## 5. Использование Neon REST API (опционально)
Neon предоставляет REST endpoint:
```
https://ep-silent-glitter-ahvalyxw.apirest.c-3.us-east-1.aws.neon.tech/neondb/rest/v1
```
Для работы с ним нужен API ключ (создаётся в консоли Neon). Храните его в `NEON_API_KEY`.

## 6. Типичные ошибки
| Сообщение | Причина | Решение |
|-----------|---------|---------|
| `No such host is known (os error 11001)` | DNS или сетевой доступ отсутствует | Проверьте DNS, VPN, Firewall |
| `certificate verify failed` | SSL режим отключён | Добавьте `?sslmode=require` |
| `password authentication failed` | Неправильные credentials | Обновите пароль или пользователя |

## 7. Следующие шаги
- Протестируйте CRUD API (`API_EXAMPLES.md`)
- Настройте мониторинг Neon (раздел Monitoring)
- Настройте бэкапы/branching при необходимости
