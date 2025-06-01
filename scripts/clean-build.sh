#!/bin/bash

echo "🧹 Очистка проекта для чистой сборки..."

# Удаляем старые файлы конфигурации
if [ -f "eslint.config.mjs" ]; then
    echo "Удаляем eslint.config.mjs..."
    rm eslint.config.mjs
fi

# Очищаем кеш и build директории
echo "Удаляем .next..."
rm -rf .next

echo "Удаляем node_modules..."
rm -rf node_modules

echo "Удаляем package-lock.json..."
rm -f package-lock.json

echo "Удаляем dist..."
rm -rf dist

echo "Удаляем out..."
rm -rf out

# Переустанавливаем зависимости
echo "📦 Устанавливаем зависимости..."
npm install --legacy-peer-deps

echo "✅ Очистка завершена!"
echo ""
echo "Теперь можно запустить:"
echo "  npm run build"