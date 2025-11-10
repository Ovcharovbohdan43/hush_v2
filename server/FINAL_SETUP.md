# 🚀 Финальная настройка Hush V2 Server (Neon)

## ✅ Все данные получены

### Neon Database
- Host: `ep-silent-glitter-ahvalyxw.us-east-1.aws.neon.tech`
- Database: `neondb`
- User: `<ваш Neon пользователь>` (напр. `neondb_owner`)
- Password: `<ваш пароль>`
- SSL: обязательно `?sslmode=require`

### Neon REST API (опционально)
- Endpoint: `https://ep-silent-glitter-ahvalyxw.apirest.c-3.us-east-1.aws.neon.tech/neondb/rest/v1`
- API Key: создайте в консоли Neon при необходимости

### SMTP (пример: Brevo)
- Host: `smtp-relay.brevo.com`
- Port: `587`
- Login: `your-smtp-username@smtp-brevo.com`
- Password: `your-smtp-password-here`

## 📝 Шаг 1: `.env`

```env
DATABASE_URL=postgresql://<username>:<password>@ep-silent-glitter-ahvalyxw.us-east-1.aws.neon.tech/neondb?sslmode=require
PORT=3001
API_BASE_URL=http://localhost:3001
JWT_SECRET=your-secret-key-change-in-production-min-32-chars-please-change-this
JWT_EXPIRES_IN=3600
REFRESH_TOKEN_EXPIRES_IN=604800
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USERNAME=your-smtp-username@smtp-brevo.com
SMTP_PASSWORD=your-smtp-password-here
SMTP_FROM=noreply@hush.example
HUSH_DOMAIN=hush.example
# Необязательно: REST доступ к Neon
# NEON_REST_ENDPOINT=https://ep-silent-glitter-ahvalyxw.apirest.c-3.us-east-1.aws.neon.tech/neondb/rest/v1
# NEON_API_KEY=your-neon-api-key
```

## 🔧 Шаг 2: Проверка подключения
```powershell
psql "postgresql://<username>:<password>@ep-silent-glitter-ahvalyxw.us-east-1.aws.neon.tech/neondb?sslmode=require"
```
Если подключение успешно — можно запускать сервер. Если нет
— проверьте VPN/DNS/Firewall.

## 🚀 Шаг 3: Запуск сервера
```powershell
cd server
cargo run
```

## ✅ Шаг 4: Health check
```powershell
curl http://localhost:3001/health
```
Ответ должен быть `OK`.

## 📋 Чеклист
- [ ] `.env` содержит учетные данные Neon
- [ ] `psql` подключается к базе
- [ ] Сервер стартует без ошибок и миграции выполняются
- [ ] `/health` возвращает `OK`
- [ ] API вызовы (`register`, `create alias`) работают и данные появляются в Neon
- [ ] SMTP отправка тестового письма проходит

## 🔍 Типичные проблемы
| Сообщение | Причина | Решение |
|-----------|---------|---------|
| `No such host is known (os error 11001)` | DNS/сетевой доступ к Neon отсутствует | Проверьте VPN/DNS, используйте публичный DNS или VPN |
| `certificate verify failed` | Используется не TLS соединение | Убедитесь, что строка содержит `?sslmode=require` |
| `password authentication failed` | Неверные credentials | Скопируйте логин/пароль из консоли Neon повторно |

## 📚 Полезные файлы
- `ENV_SETUP.md` — шаблон `.env`
- `NEON_SETUP.md` — подробная настройка Neon
- `API_EXAMPLES.md` — примеры CURL/HTTP запросов
- `CHECKLIST.md` — полный чеклист готовности

## ✨ После запуска
1. Зарегистрируйте пользователя и войдите.
2. Создайте алиас, убедитесь, что запись появилась в Neon (`SELECT * FROM aliases;`).
3. Проверьте отправку писем (SMTP).
4. Подумайте о резервном копировании и мониторинге (Neon → Monitoring).

Готово! Сервер полностью переведён на Neon и готов к интеграции/продакшену.

