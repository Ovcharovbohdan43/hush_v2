# Решение проблемы линкера Windows LNK1318

## Проблема
Линкер Windows имеет лимит на количество одновременно открытых PDB файлов (12 файлов). При большом количестве зависимостей это вызывает ошибку LNK1318.

## Решение 1: Использовать release сборку (РЕКОМЕНДУЕТСЯ)

```powershell
cargo build --release
cargo run --release
```

Release сборка создает меньше PDB файлов и обычно решает проблему.

## Решение 2: Полностью отключить PDB файлы

Добавьте в `Cargo.toml`:
```toml
[profile.dev]
debug = false
strip = true
```

Или установите переменную окружения:
```powershell
$env:CARGO_PROFILE_DEV_DEBUG = "false"
cargo build
```

## Решение 3: Использовать альтернативный линкер

Установите `lld` (LLVM Linker):
```powershell
# Установите через Visual Studio Installer или скачайте отдельно
# Затем используйте:
$env:RUSTFLAGS = "-C link-arg=-fuse-ld=lld"
cargo build
```

## Решение 4: Уменьшить параллелизм сборки

```powershell
$env:CARGO_BUILD_JOBS = "1"
cargo build
```

## Решение 5: Закрыть все программы и перезапустить

1. Закройте все IDE (VS Code, Visual Studio)
2. Закройте все терминалы
3. Перезагрузите компьютер
4. Откройте новый терминал
5. Попробуйте снова

## Рекомендация

**Используйте release сборку для разработки:**
```powershell
cargo build --release
cargo run --release
```

Это самое простое и надежное решение. Release сборка:
- Быстрее работает
- Меньше проблем с линкером
- Можно включить debug информацию если нужно:
  ```toml
  [profile.release]
  debug = true  # Включить debug в release
  ```

