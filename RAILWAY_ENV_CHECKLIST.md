# ✅ Проверка переменных окружения Railway

## Уже заполнено:
- ✅ `HUSH_DOMAIN` = `hush.autos`
- ✅ `DATABASE_URL` = Neon база данных
- ✅ `JWT_EXPIRES_IN` = `3600`

## Нужно заполнить:

### 1. **API_BASE_URL** (сейчас пусто) ⚠️ ВАЖНО
```
API_BASE_URL=https://your-project-name.railway.app
```
**Замените `your-project-name` на реальный URL вашего Railway сервиса!**
Найдите его в Railway → ваш сервис → Settings → Domains

### 2. **SMTP_FROM** (обязательно!)
```
SMTP_FROM=noreply@hush.autos
```
Адрес должен быть верифицирован в Mailgun.

### 3. **MAILGUN_API_KEY** (обязательно!)
```
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxx
```

### 4. **MAILGUN_DOMAIN** (обязательно!)
```
MAILGUN_DOMAIN=hush.autos
```

### 5. **(Опционально) MAILGUN_API_BASE_URL**
```
MAILGUN_API_BASE_URL=https://api.eu.mailgun.net
```
Укажите, если используете EU-регион.

### 6. **JWT_SECRET** (не видно в списке, но ОБЯЗАТЕЛЬНО!) ⚠️
```
JWT_SECRET=your-super-secret-key-min-32-chars-change-this
```
Случайная строка минимум 32 символа!

### 7. **WEBHOOK_SECURITY_ENABLED** (для тестирования)
```
WEBHOOK_SECURITY_ENABLED=false
```

## Чеклист:

- [ ] API_BASE_URL = ваш Railway URL
- [ ] SMTP_FROM = верифицированный email
- [ ] MAILGUN_API_KEY = ключ из Mailgun
- [ ] MAILGUN_DOMAIN = ваш Mailgun домен
- [ ] (Опционально) MAILGUN_API_BASE_URL задан для EU
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
3. Настройте webhook в Mailgun на: `https://your-railway-url.railway.app/api/v1/incoming/mailgun`

