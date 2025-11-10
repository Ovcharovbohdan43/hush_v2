# Настройка .env файла для Neon

## Создайте файл `.env` в директории `server/` со следующим содержимым:

```env
# Database - Neon
DATABASE_URL=postgresql://<username>:<password>@ep-silent-glitter-ahvalyxw.us-east-1.aws.neon.tech/neondb?sslmode=require

# Необязательно: REST API Neon Data
# NEON_REST_ENDPOINT=https://ep-silent-glitter-ahvalyxw.apirest.c-3.us-east-1.aws.neon.tech/neondb/rest/v1
# NEON_API_KEY=your-neon-api-key

# Server
PORT=3001
API_BASE_URL=http://localhost:3001

# JWT (ВАЖНО: измените на случайную строку минимум 32 символа для production!)
JWT_SECRET=your-secret-key-change-in-production-min-32-chars-please-change-this
JWT_EXPIRES_IN=3600
REFRESH_TOKEN_EXPIRES_IN=604800

# Email (SMTP) - пример конфигурации Brevo
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USERNAME=your-smtp-username@smtp-brevo.com
SMTP_PASSWORD=your-smtp-password-here
SMTP_FROM=noreply@hush.example

# Domain для алиасов
HUSH_DOMAIN=hush.example
```

> Замените `<username>` и `<password>` на учётные данные пользователя Neon (формат вида `neondb_owner` / `********`).

## Важные замечания для Neon:

1. **SSL обязательный**: Neon требует TLS-соединение. Всегда добавляйте `?sslmode=require` к `DATABASE_URL`.
2. **Проверка подключения**:
   ```powershell
   psql "postgresql://<username>:<password>@ep-silent-glitter-ahvalyxw.us-east-1.aws.neon.tech/neondb?sslmode=require"
   ```
   Убедитесь, что соединение устанавливается до запуска приложения.
3. **Отладка DNS / сети**:
   - `nslookup ep-silent-glitter-ahvalyxw.us-east-1.aws.neon.tech`
   - `ping ep-silent-glitter-ahvalyxw.us-east-1.aws.neon.tech`
   Если сервер недоступен, проверьте VPN/Firewall.
4. **REST API (опционально)**:
   Если планируете пользоваться Neon Data API, укажите `NEON_REST_ENDPOINT` и `NEON_API_KEY`, затем используйте эти значения в отдельной интеграции.
5. **Безопасность**:
   - Не коммитьте `.env` в git (он уже в `.gitignore`).
   - Храните `JWT_SECRET`, SMTP и Neon credentials в менеджере секретов.

## Следующие шаги:

1. Создайте файл `.env` с данными Neon.
2. Проверьте строку подключения через `psql`.
3. Запустите сервер: `cargo run`.
4. Убедитесь, что миграции применились и endpoint `/health` возвращает `OK`.

