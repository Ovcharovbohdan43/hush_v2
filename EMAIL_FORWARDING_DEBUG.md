# Диагностика проблемы пересылки писем

## Проблема
Письма от Booking.com не пересылаются на target email, хотя:
- Email верифицирован
- Target email создан в БД
- В логах ошибок нет

## Шаги диагностики

### 1. Проверьте логи сервера

После того как Booking.com отправит письмо на ваш алиас, проверьте логи сервера. Вы должны увидеть:

```
=== BREVO WEBHOOK RECEIVED ===
From: ...
To: ...
Subject: ...
```

Если этих логов нет - письмо не доходит до webhook endpoint.

### 2. Проверьте настройку webhook в Brevo

1. Откройте панель Brevo
2. Перейдите в Settings → Webhooks
3. Убедитесь, что настроен webhook для "Inbound emails"
4. URL должен быть: `https://your-domain.com/api/v1/incoming/brevo`
5. Проверьте, что webhook активен

### 3. Проверьте логи обработки письма

Если webhook получает письмо, вы должны увидеть в логах:

```
=== INCOMING EMAIL START ===
From: ...
To: ...
Subject: ...
Normalized recipient: '...'
Found alias: ... (user_id: ..., status: ...)
Looking up target email for user_id: ...
Found verified target email: ... for user: ...
Attempting to forward email:
  From: ...
  To: ...
  Subject: ...
=== EMAIL SERVICE: Forwarding email ===
```

### 4. Проверьте SMTP настройки

В логах должно быть:
```
Connecting to SMTP server: ...:... (username: ...)
Sending email through SMTP...
```

Если есть ошибка SMTP, она будет видна в логах.

### 5. Проверьте переменные окружения

Убедитесь, что в `.env` файле сервера установлены:
- `SMTP_HOST` - адрес SMTP сервера (например, smtp-relay.brevo.com)
- `SMTP_PORT` - порт (обычно 587)
- `SMTP_USERNAME` - ваш SMTP логин
- `SMTP_PASSWORD` - ваш SMTP пароль
- `SMTP_FROM` - адрес отправителя (должен быть верифицирован в Brevo)

### 6. Проверьте статус алиаса в БД

Выполните SQL запрос:
```sql
SELECT id, address, status, user_id 
FROM aliases 
WHERE address = 'your-alias@hush.autos';
```

Статус должен быть `active`, не `paused` или `deleted`.

### 7. Проверьте target email в БД

```sql
SELECT id, email, verified, user_id 
FROM target_emails 
WHERE user_id = 'your-user-id';
```

Поле `verified` должно быть `true`.

### 8. Проверьте email_logs

```sql
SELECT * 
FROM email_logs 
WHERE alias_id = 'your-alias-id' 
ORDER BY created_at DESC 
LIMIT 10;
```

Проверьте статус последних записей:
- `forwarded` - письмо успешно переслано
- `pending` - ошибка при пересылке
- `rejected` - отклонено (причина в metadata)
- `bounced` - отбой

## Возможные проблемы

### Проблема 1: Webhook не получает письма
**Решение:** Проверьте настройки webhook в Brevo и убедитесь, что URL доступен из интернета.

### Проблема 2: Письмо доходит, но алиас не находится
**Решение:** Проверьте, что адрес алиаса в письме точно совпадает с адресом в БД (регистр не важен).

### Проблема 3: Target email не найден или не верифицирован
**Решение:** Проверьте БД напрямую и убедитесь, что `verified = true`.

### Проблема 4: Ошибка SMTP при отправке
**Решение:** 
- Проверьте SMTP credentials
- Убедитесь, что `SMTP_FROM` адрес верифицирован в Brevo
- Проверьте логи на детали ошибки

### Проблема 5: Письмо попадает в спам
**Решение:** Проверьте папку "Спам" в вашем почтовом ящике.

## Команды для проверки

### Проверить последние логи писем
```sql
SELECT 
    el.*,
    a.address as alias_address,
    te.email as target_email
FROM email_logs el
JOIN aliases a ON el.alias_id = a.id
LEFT JOIN target_emails te ON a.user_id = te.user_id
ORDER BY el.created_at DESC
LIMIT 20;
```

### Проверить все алиасы пользователя
```sql
SELECT a.*, te.email as target_email, te.verified
FROM aliases a
LEFT JOIN target_emails te ON a.user_id = te.user_id
WHERE a.user_id = 'your-user-id'
ORDER BY a.created_at DESC;
```

## Что делать дальше

1. Перезапустите сервер с обновленным кодом (с дополнительным логированием)
2. Отправьте тестовое письмо на алиас
3. Проверьте логи сервера - вы увидите детальную информацию о каждом шаге обработки
4. Если письмо не доходит до webhook - проверьте настройки Brevo
5. Если письмо доходит, но не пересылается - проверьте логи на ошибки SMTP

