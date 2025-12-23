#!/usr/bin/env bash
set -euo pipefail

# Usage:
# 1. Замените YOUR_SCRIPT_ID_HERE в .clasp.json на реальный ID.
# 2. Дайте права на запуск: chmod +x sync_to_gas.sh
# 3. Запуск: ./sync_to_gas.sh
#
# Опции:
# ./sync_to_gas.sh -s SCRIPT_ID        # явно указать scriptId
# ./sync_to_gas.sh -f                 # форсировать push (clasp push --force)
# ./sync_to_gas.sh -b                 # только backup & diff, без push

FORCE=false
ONLY_BACKUP=false
SCRIPT_ID=""
BACKUP_DIR="${HOME}/gas-backups"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
CWD=$(pwd)

# 0. Проверка структуры проекта
if [[ ! -f "appsscript.json" ]]; then
  echo "ERROR: appsscript.json не найден. Это обязательный файл для проектa GAS."
  exit 6
fi

if [[ ! -f ".clasp.json" ]]; then
  echo "ERROR: .clasp.json не найден. Выполните настройку или используйте -s SCRIPT_ID."
  exit 7
fi

while getopts ":s:fb" opt; do
  case ${opt} in
    s) SCRIPT_ID="$OPTARG" ;;
    f) FORCE=true ;;
    b) ONLY_BACKUP=true ;;
    \?) echo "Unknown option -$OPTARG" >&2; exit 1 ;;
  esac
done

# 1. Проверки начальные
command -v clasp >/dev/null 2>&1 || { echo "ERROR: clasp not found. Install @google/clasp first."; exit 2; }

# проверка логина
if ! clasp login --status >/dev/null 2>&1; then
  echo "Не залогинен(а) в clasp. Выполните: clasp login"
  exit 3
fi

# 2. Найти scriptId
if [[ -z "$SCRIPT_ID" ]]; then
  if [[ -f ".clasp.json" ]]; then
    SCRIPT_ID=$(node -e "console.log(require('./.clasp.json').scriptId || '')" 2>/dev/null || true)
  fi
fi

if [[ -z "$SCRIPT_ID" ]]; then
  echo "Не найден scriptId. Укажи через -s SCRIPT_ID или создай .clasp.json с полем scriptId."
  exit 4
fi

echo "Script ID: $SCRIPT_ID"

# 3. Проверка git — нет незакоммиченных изменений
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "ERROR: Есть незакоммиченные изменения в репо. Сделай commit или stash перед пушем."
    git status --porcelain
    exit 5
  fi
fi

# 4. Backup удалённого кода (clasp clone в temp)
mkdir -p "$BACKUP_DIR"
BACKUP_PATH="${BACKUP_DIR}/${SCRIPT_ID}-${TIMESTAMP}"
echo "Создаю резервную копию удалённого проекта в: $BACKUP_PATH"
clasp clone "$SCRIPT_ID" "$BACKUP_PATH"

echo "Резервная копия завершена."

# 5. Diff (удалённая резервная копия vs текущая папка)
echo "Показываю краткий diff (если есть) между $BACKUP_PATH и $CWD"
if command -v diff >/dev/null 2>&1; then
  diff -ru --exclude='.git' --exclude='node_modules' "$BACKUP_PATH" "$CWD" || true
else
  echo "diff не найден — пропускаю показ различий."
fi

if $ONLY_BACKUP; then
  echo "Только backup & diff выполнены. Выход."
  exit 0
fi

# 6. Push (по умолчанию безопасный), опция --force при -f
echo "Готов к push локального кода в Apps Script. Продолжить? (y/N)"
read -r answer
if [[ "$answer" != "y" && "$answer" != "Y" ]]; then
  echo "Отменено пользователем."
  exit 0
fi

if $FORCE; then
  echo "Запускаю: clasp push --force"
  clasp push --force
else
  echo "Запускаю: clasp push"
  clasp push
fi

# 7. Версионирование (опционально) — создаём версию с отметкой времени
VER_MSG="sync: ${TIMESTAMP}"
echo "Создаю версию с сообщением: \"$VER_MSG\""
clasp version "$VER_MSG" || echo "version failed (не критично)"

echo "Готово. Открой проект: clasp open"
