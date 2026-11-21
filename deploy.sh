#!/usr/bin/env bash
# запушить обновления сайта на github pages
# использование: после post.py или любых правок просто запусти  ./deploy.sh
set -e
cd "$(dirname "$0")"
git add -A
git commit -m "update: $(date '+%d.%m %H:%M') $*" || echo "нечего коммитить — всё уже отправлено"
git push
echo
echo "готово · подожди 1–2 минуты, github pages обновит сайт"
