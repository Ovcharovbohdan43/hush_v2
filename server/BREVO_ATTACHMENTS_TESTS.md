# Тесты и документация для Brevo Attachments

## Выполненные задачи

### ✅ 1. Unit тесты для парсинга Brevo attachments

Созданы комплексные unit тесты в `server/src/api/incoming.rs` (модуль `tests`):

- ✅ `test_brevo_attachment_parsing_simple` - базовый парсинг вложения со всеми полями
- ✅ `test_brevo_attachment_base64_decoding` - декодирование base64 контента
- ✅ `test_brevo_attachment_base64_with_whitespace` - обработка base64 с пробелами
- ✅ `test_brevo_attachment_missing_filename` - обработка отсутствующего имени файла
- ✅ `test_brevo_attachment_missing_content_type` - обработка отсутствующего типа контента
- ✅ `test_brevo_attachment_missing_content` - обработка отсутствующего контента
- ✅ `test_brevo_attachment_size_limit_check` - проверка лимита размера вложений
- ✅ `test_brevo_attachment_multiple_attachments` - парсинг нескольких вложений
- ✅ `test_brevo_attachment_invalid_base64` - обработка невалидного base64
- ✅ `test_brevo_webhook_payload_deserialization` - десериализация полного payload
- ✅ `test_brevo_attachment_aliases` - поддержка различных алиасов полей

**Результат:** Все 11 тестов успешно проходят ✅

### ✅ 2. Документация маршрута `/api/v1/incoming/brevo`

Добавлена полная документация в `server/API_EXAMPLES.md` (раздел 16):

- Описание формата запроса с примерами
- Примеры использования с вложениями
- Описание всех поддерживаемых полей и их алиасов
- Информация об ограничениях размера вложений
- Примеры ответов API

### ✅ 3. Проверка функциональности парсинга и пересылки

Проверено:

1. **Парсинг attachments из Brevo webhook:**
   - Декодирование base64 контента
   - Обработка различных форматов полей (filename/name, contentType/type, content/base64)
   - Проверка размера вложений
   - Обработка отсутствующих полей

2. **Пересылка attachments:**
   - Вложения корректно передаются в `EmailService::forward_email_with_attachments`
   - Используется правильный формат multipart/mixed для email с вложениями
   - Поддерживается несколько вложений одновременно

## Структура тестов

Тесты находятся в модуле `#[cfg(test)] mod tests` в файле `server/src/api/incoming.rs`.

Все тесты используют helper функцию `create_brevo_attachment` для создания тестовых данных.

## Запуск тестов

```bash
cd server
cargo test api::incoming::tests -- --nocapture
```

## Формат Brevo webhook для вложений

```json
{
  "attachments": [
    {
      "filename": "document.pdf",
      "contentType": "application/pdf",
      "content": "base64-encoded-content",
      "size": 256
    }
  ]
}
```

Поддерживаемые алиасы:
- `filename` или `name` - имя файла
- `contentType` или `type` - MIME тип
- `content` или `base64` - содержимое в base64

## Ограничения

- Максимальный размер вложения контролируется через `MAX_ATTACHMENT_SIZE` (по умолчанию 10MB)
- Вложения превышающие лимит пропускаются с предупреждением в логах
- Вложения без base64 контента пропускаются

## Статус

✅ Все задачи выполнены
✅ Все тесты проходят успешно
✅ Документация добавлена
✅ Изменения находятся в ветке `test_1`

