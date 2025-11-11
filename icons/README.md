# Иконки расширения

## Конвертация SVG в PNG

Для создания PNG иконок из SVG файла используйте один из следующих методов:

### Метод 1: Онлайн конвертер
1. Откройте https://cloudconvert.com/svg-to-png
2. Загрузите `icon.svg`
3. Установите размеры:
   - 16x16 пикселей для `icon16.png`
   - 48x48 пикселей для `icon48.png`
   - 128x128 пикселей для `icon128.png`
4. Скачайте и переименуйте файлы соответственно

### Метод 2: Inkscape (бесплатно)
```bash
# Установите Inkscape: https://inkscape.org/
# Затем выполните команды:

inkscape icon.svg --export-filename=icon16.png --export-width=16 --export-height=16
inkscape icon.svg --export-filename=icon48.png --export-width=48 --export-height=48
inkscape icon.svg --export-filename=icon128.png --export-width=128 --export-height=128
```

### Метод 3: ImageMagick
```bash
# Установите ImageMagick: https://imagemagick.org/
magick convert -background none icon.svg -resize 16x16 icon16.png
magick convert -background none icon.svg -resize 48x48 icon48.png
magick convert -background none icon.svg -resize 128x128 icon128.png
```

### Метод 4: Node.js (если установлен)
```bash
npm install -g svg2png-cli
svg2png icon.svg --output=icon16.png --width=16 --height=16
svg2png icon.svg --output=icon48.png --width=48 --height=48
svg2png icon.svg --output=icon128.png --width=128 --height=128
```

## Размещение файлов

После создания PNG файлов, скопируйте их в папку `build/icons/`:
- `build/icons/icon16.png`
- `build/icons/icon48.png`
- `build/icons/icon128.png`
