# Chrome Extension Build Guide

## Сборка расширения

1. Установите зависимости:
```bash
npm install
```

2. Соберите расширение:
```bash
npm run build
```

3. Создайте иконки (16x16, 48x48, 128x128) и поместите их в папку `icons/`

4. Скопируйте manifest.json и иконки в папку build:
```bash
cp manifest.json build/
cp -r icons build/
```

## Установка в Chrome

1. Откройте Chrome и перейдите в `chrome://extensions/`
2. Включите "Режим разработчика" (Developer mode)
3. Нажмите "Загрузить распакованное расширение" (Load unpacked)
4. Выберите папку `build`

## Структура расширения

- `popup.html` - Popup окно расширения
- `options.html` - Страница настроек
- `background.js` - Service worker
- `content.js` - Content script для инжекта на страницы
- `manifest.json` - Манифест расширения
- `icons/` - Иконки расширения

## Настройка API

По умолчанию расширение использует `http://localhost:3001` как API endpoint.
Вы можете изменить это в настройках расширения (Options page).

