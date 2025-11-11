# ✅ Проверка переменных окружения Railway

## Уже заполнено:
- ✅ `HUSH_DOMAIN` = `hush.autos`
- ✅ `DATABASE_URL` = Neon база данных
- ✅ `JWT_EXPIRES_IN` = `3600`
- ✅ `SMTP_PORT` = `587`
- ✅ `SMTP_PASSWORD` = секрет (правильно!)

## Нужно заполнить:

### 1. **SMTP_HOST** (сейчас пусто)
```
SMTP_HOST=smtp-relay.brevo.com
```

### 2. **SMTP_USERNAME** (сейчас пусто)
```
SMTP_USERNAME=your-smtp-username@smtp-brevo.com
```
Замените на ваш реальный SMTP логин от Brevo.

### 3. **API_BASE_URL** (сейчас пусто) ⚠️ ВАЖНО
```
API_BASE_URL=https://your-project-name.railway.app
```
**Замените `your-project-name` на реальный URL вашего Railway сервиса!**
Найдите его в Railway → ваш сервис → Settings → Domains

### 4. **SMTP_FROM** (не видно в списке, но ОБЯЗАТЕЛЬНО!)
Добавьте новую переменную:
```
SMTP_FROM=noreply@hush.autos
```
Или другой email, который верифицирован в Brevo.

### 5. **JWT_SECRET** (не видно в списке, но ОБЯЗАТЕЛЬНО!) ⚠️
Добавьте новую переменную:
```
JWT_SECRET=your-super-secret-key-min-32-chars-change-this
```
Случайная строка минимум 32 символа!

### 6. **WEBHOOK_SECURITY_ENABLED** (для тестирования)
Добавьте новую переменную:
```
WEBHOOK_SECURITY_ENABLED=false
```

## Чеклист:

- [ ] SMTP_HOST = `smtp-relay.brevo.com`
- [ ] SMTP_USERNAME = ваш SMTP логин
- [ ] API_BASE_URL = ваш Railway URL
- [ ] SMTP_FROM = верифицированный email
- [ ] JWT_SECRET = случайная строка 32+ символов
- [ ] WEBHOOK_SECURITY_ENABLED = `false`

## Как найти Railway URL:

1. В Railway откройте ваш сервис
2. Перейдите в **Settings** → **Domains**
3. Там будет публичный URL (например: `hush-server-production.up.railway.app`)
4. Используйте его для `API_BASE_URL`

## После заполнения:

1. Railway автоматически перезапустит сервис
2. Проверьте: `curl https://your-railway-url.railway.app/health`
3. Настройте webhook в Brevo на: `https://your-railway-url.railway.app/api/v1/incoming/brevo`

