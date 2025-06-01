#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('🌱 Загрузка переменных окружения...');

// Сначала загружаем .env (базовые значения)
if (fs.existsSync('.env')) {
  dotenv.config({ path: '.env' });
  console.log('📦 Загрузили переменные из .env');
}

// Затем загружаем .env.local, который может переопределить .env
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local', override: true });
  console.log('📦 Загрузили переменные из .env.local');
}

console.log('\n🔍 Проверка структуры проекта для Vercel...\n');

// Проверяем критические файлы
const criticalFiles = [
  'src/auth.ts',
  'src/lib/env.ts',
  'src/lib/prisma.ts',
  'src/app/api/auth/[...nextauth]/route.ts',
  'middleware.ts',
  'next.config.ts',
  'package.json',
  'tsconfig.json'
];

console.log('📁 Проверка критических файлов:');
criticalFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// Проверяем переменные окружения
console.log('\n🔐 Проверка переменных окружения:');
const requiredEnvVars = [
  'NEXTAUTH_SECRET',
  'DATABASE_URL', 
  'OPENAI_API_KEY'
];

requiredEnvVars.forEach(envVar => {
  const exists = !!process.env[envVar];
  console.log(`  ${exists ? '✅' : '❌'} ${envVar}`);
});

// Проверяем node_modules
const nodeModulesExists = fs.existsSync(path.join(process.cwd(), 'node_modules'));
console.log(`\n📦 node_modules: ${nodeModulesExists ? '✅ Установлены' : '❌ Не найдены'}`);

// Проверяем версию Node.js
console.log(`\n🟢 Node.js версия: ${process.version}`);
console.log(`   Рекомендуется: >=18.17.0`);

console.log('\n✨ Проверка завершена!');
