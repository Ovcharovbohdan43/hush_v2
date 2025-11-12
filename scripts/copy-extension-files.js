const fs = require('fs');
const path = require('path');

// Копируем manifest.json
fs.copyFileSync('manifest.json', 'build/manifest.json');
console.log('✓ Copied manifest.json');

// Копируем иконки если они существуют
const iconsDir = 'icons';
const buildIconsDir = 'build/icons';

if (fs.existsSync(iconsDir)) {
  if (!fs.existsSync(buildIconsDir)) {
    fs.mkdirSync(buildIconsDir, { recursive: true });
  }
  
  const iconFiles = fs.readdirSync(iconsDir).filter(f => f.endsWith('.png'));
  iconFiles.forEach(file => {
    fs.copyFileSync(
      path.join(iconsDir, file),
      path.join(buildIconsDir, file)
    );
    console.log(`✓ Copied ${file}`);
  });
} else {
  console.warn('⚠ icons/ directory not found. Please create icon files.');
}

console.log('\n✅ Extension files copied successfully!');
console.log('📦 Extension is ready in build/ directory');


