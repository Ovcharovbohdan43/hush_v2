# API Examples - Hush V2 Server

Примеры использования API endpoints.

## Базовый URL

```
http://localhost:3001
```

## 1. Регистрация пользователя

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Ответ:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

## 2. Вход

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Ответ:** (аналогично регистрации)

## 3. Обновление токена

```bash
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "your-refresh-token-here"
  }'
```

## 4. Создание алиаса (требует аутентификацию)

### Random alias
```bash
curl -X POST http://localhost:3001/api/v1/aliases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "alias_type": "random"
  }'
```

### Custom alias
```bash
curl -X POST http://localhost:3001/api/v1/aliases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "alias_type": "custom",
    "custom": "my-custom-alias"
  }'
```

### Temporary alias (1 hour)
```bash
curl -X POST http://localhost:3001/api/v1/aliases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "alias_type": "temporary",
    "ttl_minutes": 60
  }'
```

**Ответ:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "address": "hush-abc12345@hush.example",
  "status": "active",
  "created_at": "2024-01-01T12:00:00Z"
}
```

## 5. Список алиасов

```bash
curl -X GET http://localhost:3001/api/v1/aliases \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Ответ:**
```json
{
  "aliases": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "address": "hush-abc12345@hush.example",
      "status": "active",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

## 6. Включение/выключение алиаса

```bash
curl -X POST http://localhost:3001/api/v1/aliases/ALIAS_ID/toggle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "enabled": false
  }'
```

## 7. Удаление алиаса

```bash
curl -X DELETE http://localhost:3001/api/v1/aliases/ALIAS_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 8. Логи алиаса

```bash
curl -X GET "http://localhost:3001/api/v1/aliases/ALIAS_ID/logs?limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Ответ:**
```json
{
  "logs": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "from": "sender@example.com",
      "subject": "Test Email",
      "status": "forwarded",
      "time": "2024-01-01T12:00:00Z",
      "metadata": null
    }
  ]
}
```

## 9. Запрос верификации целевого email

```bash
curl -X POST http://localhost:3001/api/v1/targets/request_verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "target": "my-real-email@example.com"
  }'
```

**Ответ:**
```json
{
  "message": "verification_sent"
}
```

## 10. Получение текущего целевого email

```bash
curl -X GET http://localhost:3001/api/v1/targets \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Ответ:**
```json
{
  "email": "my-real-email@example.com",
  "verified": true
}
```

## 11. Верификация email (публичный endpoint)

```bash
curl -X POST "http://localhost:3001/api/v1/targets/verify?token=VERIFICATION_TOKEN"
```

**Ответ:**
```json
{
  "message": "Email verified successfully",
  "email": "my-real-email@example.com"
}
```

## 12. Health check

```bash
curl http://localhost:3001/health
```

**Ответ:** `OK`

## 13. Email Forwarding Webhook (Mailgun - JSON)

```bash
curl -X POST http://localhost:3001/api/v1/incoming/mailgun/json \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "hush-abc12345@hush.example",
    "sender": "sender@example.com",
    "subject": "Test Email",
    "body-plain": "Plain text body",
    "body-html": "<html><body>HTML body</body></html>",
    "Message-Id": "<message-id@example.com>"
  }'
```

**Ответ:**
```json
{
  "status": "forwarded",
  "target": "user@example.com"
}
```

## 14. Email Forwarding Webhook (Mailgun - Form)

```bash
curl -X POST http://localhost:3001/api/v1/incoming/mailgun \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "recipient=hush-abc12345@hush.example&sender=sender@example.com&subject=Test&body-plain=Body"
```

## 15. Email Forwarding Webhook (SendGrid)

```bash
curl -X POST http://localhost:3001/api/v1/incoming/sendgrid \
  -H "Content-Type: application/json" \
  -d '{
    "to": "hush-abc12345@hush.example",
    "from": "sender@example.com",
    "subject": "Test Email",
    "text": "Plain text body",
    "html": "<html><body>HTML body</body></html>"
  }'
```

## 16. Email Forwarding Webhook (Brevo) с вложениями

Brevo webhook поддерживает вложения в формате base64. Это основной формат для обработки вложений.

```bash
curl -X POST http://localhost:3001/api/v1/incoming/brevo \
  -H "Content-Type: application/json" \
  -d '{
    "from": {
      "email": "sender@example.com",
      "name": "Test Sender"
    },
    "to": [
      {
        "email": "hush-abc12345@hush.example",
        "name": "Recipient"
      }
    ],
    "subject": "Test Email with Attachments",
    "text": "Plain text body",
    "html": "<html><body>HTML body</body></html>",
    "message-id": "<message-id@example.com>",
    "attachments": [
      {
        "filename": "document.pdf",
        "contentType": "application/pdf",
        "content": "JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iag===",
        "size": 256
      },
      {
        "filename": "image.jpg",
        "contentType": "image/jpeg",
        "content": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A",
        "size": 128
      }
    ]
  }'
```

**Ответ:**
```json
{
  "status": "forwarded",
  "target": "user@example.com"
}
```

### Особенности Brevo webhook:

- **Вложения**: Поддерживаются вложения в формате base64 в поле `content` или `base64`
- **Размер вложений**: Максимальный размер контролируется через `MAX_ATTACHMENT_SIZE` (по умолчанию 10MB)
- **Формат полей**: 
  - `filename` или `name` - имя файла
  - `contentType` или `type` - MIME тип
  - `content` или `base64` - содержимое в base64
  - `size` - размер в байтах (опционально)
- **Обработка**: Вложения автоматически декодируются из base64 и пересылаются вместе с письмом
- **Ограничения**: Вложения превышающие лимит размера пропускаются с предупреждением в логах

## Обработка ошибок

Все ошибки возвращаются в формате:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

### Примеры ошибок:

**401 Unauthorized** (нет токена или токен невалидный):
```json
{
  "error": "Missing Authorization header",
  "message": "Authentication error: Missing Authorization header"
}
```

**400 Bad Request** (валидация):
```json
{
  "error": "Invalid email format",
  "message": "Validation error: Invalid email format"
}
```

**404 Not Found**:
```json
{
  "error": "Alias not found",
  "message": "Not found: Alias not found"
}
```

## Примечания

- Все защищенные endpoints требуют заголовок `Authorization: Bearer <access_token>`
- Access token действителен 1 час (по умолчанию)
- Refresh token действителен 7 дней (по умолчанию)
- При истечении access token используйте `/api/v1/auth/refresh` для получения нового

