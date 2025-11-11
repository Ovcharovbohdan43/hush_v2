import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';

// Плагин для исправления путей в HTML файлах (для расширений Chrome)
function fixHtmlPaths() {
  return {
    name: 'fix-html-paths',
    writeBundle() {
      // Исправляем пути в popup.html
      const popupPath = 'build/popup.html';
      if (existsSync(popupPath)) {
        let popupContent = readFileSync(popupPath, 'utf-8');
        popupContent = popupContent.replace(/src="\/assets\//g, 'src="./assets/');
        popupContent = popupContent.replace(/href="\/assets\//g, 'href="./assets/');
        writeFileSync(popupPath, popupContent);
        console.log('✓ Fixed paths in popup.html');
      }

      // Исправляем пути в options.html
      const optionsPath = 'build/options.html';
      if (existsSync(optionsPath)) {
        let optionsContent = readFileSync(optionsPath, 'utf-8');
        optionsContent = optionsContent.replace(/src="\/assets\//g, 'src="./assets/');
        optionsContent = optionsContent.replace(/href="\/assets\//g, 'href="./assets/');
        writeFileSync(optionsPath, optionsContent);
        console.log('✓ Fixed paths in options.html');
      }
    },
  };
}

// Плагин для копирования manifest.json и иконок
function copyManifest() {
  return {
    name: 'copy-manifest',
    writeBundle() {
      // Копируем manifest.json если он существует
      if (existsSync('manifest.json')) {
        copyFileSync('manifest.json', 'build/manifest.json');
        console.log('✓ Copied manifest.json');
      }
      
      // Создаем директорию для иконок
      const iconsDir = 'build/icons';
      if (!existsSync(iconsDir)) {
        mkdirSync(iconsDir, { recursive: true });
      }
      
      // Копируем иконки если они существуют
      if (existsSync('icons')) {
        const iconFiles = readdirSync('icons').filter((f: string) => f.endsWith('.png'));
        iconFiles.forEach((file: string) => {
          copyFileSync(`icons/${file}`, `build/icons/${file}`);
          console.log(`✓ Copied ${file}`);
        });
      } else {
        console.warn('⚠ icons/ directory not found. Please create icon files.');
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), fixHtmlPaths(), copyManifest()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'popup.html'),
        options: path.resolve(__dirname, 'options.html'),
        background: path.resolve(__dirname, 'src/background.ts'),
        content: path.resolve(__dirname, 'src/content.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background' || chunkInfo.name === 'content') {
            return '[name].js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
