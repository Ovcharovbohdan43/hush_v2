# 📧 Настройка Email Forwarding

## Обзор

Email Forwarding позволяет получать письма на алиасы и автоматически пересылать их на целевой email пользователя.

## Архитектура

1. **Почтовый провайдер** (Mailgun/SendGrid/AWS SES) получает входящие письма на домен
2. **Webhook** отправляет данные письма на наш сервер
3. **Сервер** находит алиас по адресу получателя
4. **Пересылка** письма на целевой email пользователя
5. **Логирование** события в базу данных

## Поддерживаемые провайдеры

### Mailgun
- **Webhook URL**: `POST /api/v1/incoming/mailgun`
- **Формат**: `application/x-www-form-urlencoded`
- **Документация**: https://documentation.mailgun.com/en/latest/user_manual.html#receiving-forwarding-and-storing-messages

### SendGrid
- **Webhook URL**: `POST /api/v1/incoming/sendgrid`
- **Формат**: `application/json`
- **Документация**: https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook

### Универсальный JSON формат
- **Webhook URL**: `POST /api/v1/incoming/mailgun/json`
- **Формат**: `application/json`

## Настройка DNS

### 1. MX запись (Mail Exchange)

MX запись указывает почтовому серверу, куда отправлять письма для вашего домена.

**Для Mailgun:**
```
Type: MX
Name: @ (или ваш поддомен)
Priority: 10
Value: mxa.mailgun.org
```

**Для SendGrid:**
```
Type: MX
Name: @ (или ваш поддомен)
Priority: 10
Value: mx.sendgrid.net
```

**Для AWS SES:**
```
Type: MX
Name: @ (или ваш поддомен)
Priority: 10
Value: inbound-smtp.us-east-1.amazonaws.com
```

### 2. SPF запись (Sender Policy Framework)

SPF запись указывает, какие серверы могут отправлять письма от имени вашего домена.

**Пример для Mailgun:**
```
Type: TXT
Name: @
Value: v=spf1 include:mailgun.org ~all
```

**Пример для SendGrid:**
```
Type: TXT
Name: @
Value: v=spf1 include:sendgrid.net ~all
```

### 3. DKIM запись (DomainKeys Identified Mail)

DKIM запись используется для подписи писем. Получите ключи от вашего провайдера.

**Пример:**
```
Type: TXT
Name: mail._domainkey
Value: [DKIM ключ от провайдера]
```

### 4. DMARC запись (Domain-based Message Authentication)

DMARC запись определяет политику обработки писем.

**Пример:**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

## Настройка провайдера

### Mailgun

1. Зарегистрируйтесь на https://www.mailgun.com/
2. Добавьте ваш домен в Mailgun
3. Настройте DNS записи (MX, SPF, DKIM)
4. В настройках домена укажите:
   - **Inbound Route**: `https://your-server.com/api/v1/incoming/mailgun`
   - **Method**: POST
   - **Action**: Store & Notify

### SendGrid

1. Зарегистрируйтесь на https://sendgrid.com/
2. Перейдите в Settings → Inbound Parse
3. Добавьте новый Inbound Parse:
   - **Subdomain**: ваш поддомен (например, `mail`)
   - **Domain**: ваш домен
   - **Destination URL**: `https://your-server.com/api/v1/incoming/sendgrid`
   - **POST the raw, full MIME message**: включено

### AWS SES

1. Настройте SES в AWS консоли
2. Создайте Receipt Rule:
   - **Rule name**: ваш домен
   - **Recipient**: `*@yourdomain.com`
   - **Action**: SNS Topic или Lambda Function
   - **Lambda function**: отправляет данные на ваш webhook

## Формат Webhook

### Mailgun (form-urlencoded)

```http
POST /api/v1/incoming/mailgun
Content-Type: application/x-www-form-urlencoded

recipient=alias@hush.example
sender=sender@example.com
subject=Test Email
body-plain=Plain text body
body-html=<html>HTML body</html>
Message-Id=<message-id>
```

### SendGrid (JSON)

```http
POST /api/v1/incoming/sendgrid
Content-Type: application/json

{
  "to": "alias@hush.example",
  "from": "sender@example.com",
  "subject": "Test Email",
  "text": "Plain text body",
  "html": "<html>HTML body</html>",
  "message-id": "<message-id>"
}
```

### Универсальный JSON формат

```http
POST /api/v1/incoming/mailgun/json
Content-Type: application/json

{
  "recipient": "alias@hush.example",
  "sender": "sender@example.com",
  "subject": "Test Email",
  "body-plain": "Plain text body",
  "body-html": "<html>HTML body</html>",
  "Message-Id": "<message-id>"
}
```

## Ответы API

### Успешная пересылка

```json
{
  "status": "forwarded",
  "target": "user@example.com"
}
```

### Алиас не найден

```json
{
  "status": "ignored",
  "reason": "alias_not_found"
}
```

### Целевой email не верифицирован

```json
{
  "status": "rejected",
  "reason": "target_email_not_verified"
}
```

### Целевой email не установлен

```json
{
  "status": "rejected",
  "reason": "no_target_email"
}
```

## Безопасность

⚠️ **Важно**: Webhook endpoints публичные, но должны быть защищены в production:

1. **Webhook Secret**: Добавьте проверку подписи от провайдера
2. **IP Whitelist**: Ограничьте доступ только с IP адресов провайдера
3. **Rate Limiting**: Ограничьте количество запросов
4. **HTTPS**: Используйте HTTPS для всех webhook endpoints

## Тестирование

Используйте скрипты из `TEST_EMAIL_FORWARDING.ps1` для тестирования функционала.

## Troubleshooting

### Письма не приходят

1. Проверьте MX записи: `nslookup -type=MX yourdomain.com`
2. Проверьте настройки webhook в панели провайдера
3. Проверьте логи сервера на наличие ошибок
4. Убедитесь, что сервер доступен из интернета (для webhook)

### Письма не пересылаются

1. Проверьте, что алиас существует и активен
2. Проверьте, что целевой email верифицирован
3. Проверьте логи сервера на ошибки SMTP
4. Проверьте настройки SMTP в `.env`

### DNS записи не работают

1. Подождите 24-48 часов для распространения DNS
2. Проверьте записи через `dig` или `nslookup`
3. Убедитесь, что записи настроены правильно
4. Проверьте TTL записей

