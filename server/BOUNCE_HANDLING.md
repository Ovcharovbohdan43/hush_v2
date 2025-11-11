# Обработка Bounce сообщений

## Реализованная функциональность

### ✅ Определение bounce сообщений

Система автоматически определяет bounce сообщения по следующим признакам:

1. **Отправитель (Sender):**
   - `MAILER-DAEMON`
   - `postmaster`
   - `mail delivery subsystem`
   - `bounce@`
   - `returned-mail@`
   - И другие стандартные паттерны

2. **Тема письма (Subject):**
   - "Undelivered Mail"
   - "Mail Delivery Failed"
   - "Delivery Status Notification"
   - "Returned Mail"
   - И другие стандартные паттерны

3. **Содержимое письма (Body):**
   - "Delivery has failed"
   - "Could not be delivered"
   - "Delivery delayed"
   - "Temporarily unavailable"

4. **Заголовки (Headers):**
   - `Return-Path: <>`
   - `X-Failed-Recipients:`
   - И другие индикаторы bounce

### ✅ Типы bounce

Система различает два типа bounce:

- **Hard Bounce** - постоянная ошибка доставки (несуществующий адрес, заблокированный домен)
- **Soft Bounce** - временная ошибка доставки (переполненный почтовый ящик, временная недоступность)

### ✅ Логирование bounce

Все bounce сообщения логируются в таблицу `email_logs` со статусом `bounced` и метаданными:

```json
{
  "bounce_type": "hard_bounce" | "soft_bounce" | "unknown",
  "bounce_reason": "Причина отскока",
  "failed_recipient": "email@example.com",
  "message_id": "message-id"
}
```

### ✅ Уведомление пользователя

При обнаружении bounce сообщения система автоматически отправляет уведомление пользователю на его основной email адрес с информацией о проблеме доставки.

## API Endpoints

### Обработка входящих писем с bounce detection

Все webhook endpoints автоматически проверяют входящие письма на bounce:

- `POST /api/v1/incoming/mailgun`
- `POST /api/v1/incoming/mailgun/json`
- `POST /api/v1/incoming/sendgrid`
- `POST /api/v1/incoming/brevo`

### Ответ при обнаружении bounce

```json
{
  "status": "bounced",
  "bounce_type": "hard_bounce",
  "reason": "User mailbox is full"
}
```

## Примеры использования

### Пример bounce сообщения

```json
{
  "recipient": "hush-abc12345@hush.example",
  "sender": "MAILER-DAEMON@example.com",
  "subject": "Undelivered Mail Returned to Sender",
  "body-plain": "Delivery has failed for the following recipient:\nuser@example.com\nReason: User mailbox is full"
}
```

### Просмотр bounce в логах

Bounce сообщения можно найти в логах алиаса через API:

```bash
GET /api/v1/aliases/{alias_id}/logs
```

Ответ будет содержать записи со статусом `bounced`:

```json
{
  "logs": [
    {
      "id": "...",
      "from": "MAILER-DAEMON@example.com",
      "subject": "Undelivered Mail Returned to Sender",
      "status": "bounced",
      "metadata": {
        "bounce_type": "hard_bounce",
        "bounce_reason": "User mailbox is full",
        "failed_recipient": "user@example.com"
      },
      "time": "2024-01-01T12:00:00Z"
    }
  ]
}
```

## Тестирование

Все функции bounce detection покрыты unit тестами:

```bash
cargo test test_bounce -- --nocapture
```

Тесты проверяют:
- Определение bounce по отправителю
- Определение bounce по теме
- Определение bounce по содержимому
- Определение bounce по заголовкам
- Различение hard и soft bounce
- Извлечение причины bounce
- Правильное игнорирование обычных писем

## Конфигурация

Нет специальных настроек для bounce handling - все работает автоматически.

## Будущие улучшения

- [ ] Поддержка специальных bounce webhook от провайдеров (Mailgun, SendGrid, Brevo)
- [ ] Статистика bounce по алиасам
- [ ] Автоматическое отключение алиасов при частых bounce
- [ ] Более детальный анализ причин bounce
- [ ] Интеграция с push уведомлениями

