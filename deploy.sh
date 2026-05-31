#!/bin/bash
# Деплой локальных изменений на сервер Яндекса (uniplay-kids.ru).
# Пушит в origin (bare-репо на сервере), затем на сервере: pull + build + перезапуск PM2.
set -e

SERVER="ubuntu@158.160.208.163"
KEY="$HOME/.ssh/yandex_student_reports"
SSH="ssh -i $KEY -o ConnectTimeout=20"

echo "📤 Пушу в origin..."
git push origin main

echo "🔄 Обновляю и пересобираю на сервере..."
$SSH "$SERVER" '
  set -e
  cd /var/www/kids-app
  git pull --ff-only origin main
  # ставим зависимости только если изменился package-lock
  if ! git diff --quiet HEAD@{1} HEAD -- package-lock.json 2>/dev/null; then
    echo "📦 package-lock изменился — npm install..."
    npm install
  fi
  echo "🏗️  next build..."
  npm run build
  echo "♻️  перезапуск PM2..."
  pm2 restart kids-app-frontend
'
echo "✅ Готово. Сайт: https://uniplay-kids.ru"
