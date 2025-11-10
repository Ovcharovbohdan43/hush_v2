# 🧪 Руководство по тестированию Hush V2 Server

## ✅ Сервер запущен и работает!

Health check: `http://localhost:3001/health` → `OK`

## 📋 Пошаговое тестирование

### Шаг 1: Регистрация пользователя

```powershell
$body = @{
    email = "test@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Ожидаемый результат:**
- `access_token` (JWT токен)
- `refresh_token`
- `expires_in: 3600`

**Сохраните токены для следующих шагов:**
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$token = $response.access_token
```

### Шаг 2: Вход (если уже зарегистрированы)

```powershell
$body = @{
    email = "test@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$token = $response.access_token
```

### Шаг 3: Создание алиаса

#### Random alias (случайный)
```powershell
$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    alias_type = "random"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/v1/aliases" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

**Ожидаемый результат:**
- `id` (UUID алиаса)
- `address` (например: `hush-abc12345@hush.example`)
- `status: "active"`
- `created_at`

#### Custom alias (свой)
```powershell
$body = @{
    alias_type = "custom"
    custom = "my-alias"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/v1/aliases" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

**Результат:** `my-alias@hush.example`

### Шаг 4: Получение списка алиасов

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/v1/aliases" `
    -Method GET `
    -Headers @{ Authorization = "Bearer $token" }
```

### Шаг 5: Настройка целевого email

#### Запрос верификации
```powershell
$body = @{
    target = "your-real-email@gmail.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/v1/targets/request_verify" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

**Что происходит:**
1. Сервер отправляет письмо с токеном верификации на указанный email
2. Проверьте почту (включая спам)
3. Скопируйте токен из письма

#### Верификация email
```powershell
# Токен из письма
$verifyToken = "your-verification-token-from-email"

Invoke-RestMethod -Uri "http://localhost:3001/api/v1/targets/verify?token=$verifyToken" `
    -Method POST
```

#### Проверка текущего целевого email
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/v1/targets" `
    -Method GET `
    -Headers @{ Authorization = "Bearer $token" }
```

### Шаг 6: Управление алиасами

#### Включение/выключение алиаса
```powershell
$aliasId = "your-alias-id-here"

$body = @{
    enabled = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/v1/aliases/$aliasId/toggle" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

#### Просмотр логов алиаса
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/v1/aliases/$aliasId/logs?limit=20" `
    -Method GET `
    -Headers @{ Authorization = "Bearer $token" }
```

#### Удаление алиаса
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/v1/aliases/$aliasId" `
    -Method DELETE `
    -Headers @{ Authorization = "Bearer $token" }
```

## 🔍 Проверка работы базы данных

### Подключение к Neon через psql

```powershell
# Используйте DATABASE_URL из .env
psql "postgresql://neondb_owner:YOUR_PASSWORD@ep-silent-glitter-ahvalyxw.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### Проверка данных

```sql
-- Проверка пользователей
SELECT id, email, created_at FROM users;

-- Проверка алиасов
SELECT id, user_id, address, status, created_at FROM aliases;

-- Проверка целевых email
SELECT user_id, email, verified, verified_at FROM target_emails;

-- Проверка логов
SELECT id, alias_id, from_email, subject, status, created_at FROM email_logs LIMIT 10;
```

## ✅ Чеклист тестирования

- [ ] Health endpoint возвращает `OK`
- [ ] Регистрация пользователя работает
- [ ] Вход работает
- [ ] Создание random алиаса работает
- [ ] Создание custom алиаса работает
- [ ] Получение списка алиасов работает
- [ ] Запрос верификации email отправляет письмо
- [ ] Верификация email работает (после получения токена)
- [ ] Включение/выключение алиаса работает
- [ ] Удаление алиаса работает
- [ ] Данные сохраняются в базе Neon.tech

## 🐛 Отладка проблем

### Проблема: "401 Unauthorized"
- Проверьте, что токен передается в заголовке `Authorization: Bearer <token>`
- Убедитесь, что токен не истек (срок действия 1 час)
- Используйте `/api/v1/auth/refresh` для обновления токена

### Проблема: "Email не отправляется"
- Проверьте настройки SMTP в `.env`
- Убедитесь, что `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` корректны
- Проверьте логи сервера на наличие ошибок SMTP

### Проблема: "База данных недоступна"
- Проверьте `DATABASE_URL` в `.env`
- Убедитесь, что Neon.tech доступен: `ping ep-silent-glitter-ahvalyxw.us-east-1.aws.neon.tech`
- Проверьте подключение через `psql`

## 🚀 Следующие шаги после тестирования

1. **Интеграция с фронтендом**
   - Подключите React приложение к API
   - Настройте CORS (если нужно)
   - Реализуйте UI для управления алиасами

2. **Production готовность**
   - Настройте HTTPS
   - Ограничьте CORS для конкретных доменов
   - Добавьте rate limiting
   - Настройте логирование
   - Добавьте мониторинг

3. **Дополнительные функции**
   - Email forwarding (получение писем на алиасы)
   - Webhooks для уведомлений
   - Статистика использования
   - Экспорт данных

## 📚 Полезные ссылки

- `API_EXAMPLES.md` - примеры curl запросов
- `ENV_SETUP.md` - настройка переменных окружения
- `NEON_SETUP.md` - работа с базой данных Neon.tech

