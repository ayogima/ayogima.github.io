#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
постер для сайта site-nothing — пиши что хочешь, цепляй картинку.

использование:
  python3 post.py "текст поста"                 # просто текст
  python3 post.py "текст" -i photo.jpg           # текст + картинка
  python3 post.py -i photo.jpg                   # только картинка
  python3 post.py --pin "текст"                  # сразу закрепить
  python3 post.py                                # интерактивный режим
  python3 post.py --file draft.txt               # текст из файла
  python3 post.py --list                         # все посты
  python3 post.py --edit p2 "новый текст"        # сменить текст
  python3 post.py --edit p2 -i new.jpg           # сменить картинку
  python3 post.py --pin p2                       # закрепить/открепить
  python3 post.py --delete p2                    # удалить пост
  python3 post.py --like p2                      # +1 лайк посту
  python3 post.py --comment p2 "текст" --by Имя  # добавить комментарий
  python3 post.py --setup git@github.com:НИК/РЕПО.git   # ОДИН РАЗ: подключить github

после --setup каждый пост/комментарий/лайк сам улетает на github
(сайт обновляется сам через ~минуту, страница подхватывает без reload).

посты: posts.json + картинки pN.jpg в корне сайта.
"""
import argparse
import json
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

BASE = Path(__file__).resolve().parent
DATA = BASE / 'posts.json'
REPO = BASE / '.repo.json'
IMG_EXT = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}


def git(*a):
    return subprocess.run(['git', *a], cwd=BASE, capture_output=True, text=True)


def git_push(msg):
    """коммит + пуш, если репозиторий подключён через --setup"""
    if not REPO.exists():
        return
    git('add', '-A')
    r = git('commit', '-m', msg)
    if 'nothing to commit' in r.stdout + r.stderr:
        return
    p = git('push')
    if p.returncode == 0:
        print('  → github обновлён, сайт подхватит через ~минуту')
    else:
        err = (p.stderr or '?').strip().splitlines()
        print('  ! push не вышел:', err[-1] if err else '?')


def setup_firebase(raw):
    """принимает конфиг из консоли firebase (JS-объект или JSON) и пишет firebase-config.js"""
    import re
    m = re.search(r'\{.*\}', raw, re.S)
    if not m:
        return print('не понял конфиг — вставь целиком кусок вида const firebaseConfig = { ... }')
    s = m.group(0)
    s = re.sub(r'([{,]\s*)(\w+)\s*:', r'\1"\2":', s)      # ключи без кавычек → с кавычками
    s = re.sub(r',\s*}', '}', s)                           # висячая запятая
    try:
        cfg = json.loads(s)
    except Exception as e:
        return print(f'конфиг не распарсился ({e}) — вставь его целиком, как дал firebase')
    need = {'apiKey', 'authDomain', 'projectId', 'appId'}
    if not need.issubset(cfg):
        return print(f'в конфиге не хватает: {need - set(cfg)}')
    js = ('// firebase-конфиг сайта (публичный, это не секрет)\n'
          '// с ним лайки и комментарии видны всем в реальном времени\n'
          'window.FB_CONFIG = ' + json.dumps(cfg, ensure_ascii=False, indent=2) + ';\n')
    (BASE / 'firebase-config.js').write_text(js, encoding='utf-8')
    print('firebase-config.js записан')
    git_push('firebase: глобальные лайки и комментарии включены')
    print('готово! обнови страницу сайта — под постами появятся формы комментариев')


def setup_chat(bot):
    """запоминает юзернейм телеграм-бота для входа в чат"""
    bot = bot.strip().lstrip('@')
    if not bot.endswith('bot') and not bot.endswith('Bot'):
        print(f'юзернейм бота обычно кончается на «bot», а это «{bot}» — но сохраняю как есть')
    js = ('// телеграм-бот для входа в чат (публичный юзернейм, не секрет)\n'
          '// adminId — id телеграма владельца (для плашки «админ»), можно оставить null\n'
          f'window.CHAT_CONFIG = {{ bot: "{bot}", adminId: null }};\n')
    (BASE / 'chat-config.js').write_text(js, encoding='utf-8')
    print(f'chat-config.js записан (бот @{bot})')
    git_push('chat: вход через телеграм включён')
    print('готово! на сайте появится кнопка чата (обнови страницу)')


def setup_repo(url):
    url = url.strip().rstrip('/')
    if url.startswith('https://github.com/'):
        url = url.replace('https://github.com/', 'git@github.com:').replace('.git', '') + '.git'
    git('remote', 'remove', 'origin')
    git('remote', 'add', 'origin', url)
    f = git('fetch', 'origin')
    if f.returncode != 0:
        git('remote', 'remove', 'origin')
        print('не получилось подключиться. проверь:')
        print('  1) ssh-ключ добавлен на github (Settings → SSH keys)')
        print('  2) адрес верный, например git@github.com:ник/ник.github.io.git')
        print('  3) в терминале работает:  ssh -T git@github.com')
        return
    if git('rev-parse', '--verify', 'origin/main').returncode == 0:
        git('reset', 'origin/main')   # наши файлы поверх удалённой истории
    git('add', '-A')
    git('commit', '-m', 'sync: локальная версия поверх репозитория')
    p = git('push', '-u', 'origin', 'main')
    if p.returncode == 0:
        REPO.write_text(json.dumps({'remote': url}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print('готово! репозиторий подключён — дальше посты улетают сами.')
    else:
        print('push не вышел:'); print((p.stderr or '?').strip()[:500])


# ---------- хранилище ----------
def load():
    if DATA.exists():
        return json.loads(DATA.read_text(encoding='utf-8'))
    return {'posts': []}


def save(d):
    DATA.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def next_id(posts):
    nums = [int(p['id'][1:]) for p in posts if p['id'].startswith('p') and p['id'][1:].isdigit()]
    return f'p{max(nums, default=0) + 1}'


def find(d, pid):
    for p in d['posts']:
        if p['id'] == pid:
            return p
    sys.exit(f'пост {pid} не найден. смотри --list')


# ---------- картинка: копируем, при возможности сжимаем ----------
def copy_image(src, pid):
    src = Path(src).expanduser().resolve()
    if not src.is_file():
        sys.exit(f'картинка не найдена: {src}')
    ext = src.suffix.lower()
    if ext not in IMG_EXT:
        sys.exit(f'нужен jpg / png / webp / gif, а это {ext}')
    dst = BASE / f'{pid}{ext}'

    if ext != '.gif':  # gif не пережимаем — убьём анимацию
        try:
            from PIL import Image
            with Image.open(src) as im:
                if im.mode not in ('RGB', 'RGBA'):
                    im = im.convert('RGBA')
                w, h = im.size
                if max(w, h) > 1600:
                    k = 1600 / max(w, h)
                    im = im.resize((round(w * k), round(h * k)), Image.LANCZOS)
                if ext in ('.jpg', '.jpeg'):
                    im.save(dst, 'JPEG', quality=85, optimize=True)
                else:
                    im.save(dst)
            print(f'  картинка: {dst.name} {im.size[0]}×{im.size[1]}')
            return dst.relative_to(BASE).as_posix()
        except ImportError:
            pass
    shutil.copy(src, dst)
    print(f'  картинка: {dst.name} (скопировано как есть)')
    return dst.relative_to(BASE).as_posix()


# ---------- интерактивный режим ----------
def interactive():
    print('пост — пиши текст. пустая строка или «.» — закончить:')
    lines = []
    while True:
        try:
            line = input('  > ')
        except EOFError:
            break
        if line.strip() in ('', '.'):
            break
        lines.append(line)
    text = '\n'.join(lines).strip()
    img = input('картинка (путь/Enter — без неё): ').strip() or None
    return text, img


# ---------- команды ----------
def cmd_list(d):
    if not d['posts']:
        print('постов нет')
        return
    print(f'{"id":4} {"♥":3} {"💬":3} {"закреп":7} {"дата":17} текст')
    for p in sorted(d['posts'], key=lambda x: x['date'], reverse=True):
        pin = '•' if p.get('pinned') else ''
        txt = (p.get('text') or '').replace('\n', ' ')[:44]
        img = ' [img]' if p.get('image') else ''
        when = p['date'][:16].replace('T', ' ')
        hearts = str(p.get('likes', 0))
        comments = str(len(p.get('comments', [])))
        print(f'{p["id"]:4} {hearts:3} {comments:3} {pin:7} {when:17} {txt}{img}')


def main():
    ap = argparse.ArgumentParser(description='посты для site-nothing', add_help=True)
    ap.add_argument('text', nargs='?', help='текст поста')
    ap.add_argument('-i', '--image', help='картинка (jpg/png/webp/gif)')
    ap.add_argument('--file', help='взять текст из файла')
    ap.add_argument('--pin', action='store_true', help='закрепить новый пост')
    ap.add_argument('--list', action='store_true', help='показать посты')
    ap.add_argument('--delete', metavar='ID', help='удалить пост')
    ap.add_argument('--edit', metavar='ID', help='редактировать пост')
    ap.add_argument('--like', metavar='ID', help='+1 лайк посту')
    ap.add_argument('--comment', metavar='ID', help='комментарий к посту: --comment p2 "текст"')
    ap.add_argument('--by', help='имя автора комментария (с --comment)')
    ap.add_argument('--setup', metavar='REPO', help='подключить github-репозиторий (один раз)')
    ap.add_argument('--firebase', metavar='CONFIG', help='вставить конфиг firebase (глобальные лайки/комменты)')
    ap.add_argument('--chat', metavar='BOT', help='юзернейм телеграм-бота для входа в чат (@...bot)')
    args = ap.parse_args()

    d = load()

    # чат через телеграм-виджет
    if args.chat:
        return setup_chat(args.chat)

    # глобальные лайки/комментарии через firebase
    if args.firebase:
        return setup_firebase(args.firebase)

    # подключение github
    if args.setup:
        return setup_repo(args.setup)

    # комментарий
    if args.comment:
        p = find(d, args.comment)
        if not args.text:
            return print('дай текст: --comment p2 "текст комментария"')
        p.setdefault('comments', []).append({
            'by': (args.by or 'аноним').strip(),
            'text': args.text.strip(),
            'date': datetime.now().isoformat(timespec='seconds'),
        })
        save(d)
        git_push(f'comment: {p["id"]}')
        return print(f'комментарий добавлен к {p["id"]} ({(args.by or "аноним").strip()})')

    # лайк
    if args.like:
        p = find(d, args.like)
        p['likes'] = int(p.get('likes', 0)) + 1
        save(d)
        git_push(f'like: {p["id"]} → {p["likes"]}')
        return print(f'{p["id"]}: лайков теперь {p["likes"]}')

    # список
    if args.list:
        return cmd_list(d)

    # удаление
    if args.delete:
        p = find(d, args.delete)
        d['posts'].remove(p)
        if p.get('image'):
            f = BASE / p['image']
            if f.exists():
                f.unlink()
                print(f'  удалена картинка {f.name}')
        save(d)
        git_push(f'post: удалить {p["id"]}')
        return print(f'пост {p["id"]} удалён')

    # редактирование: --edit ID ["новый текст"] [-i new.jpg]
    if args.edit:
        p = find(d, args.edit)
        if args.text is not None:
            p['text'] = args.text.strip()
            print(f'  текст обновлён')
        if args.image:
            old = BASE / p['image'] if p.get('image') else None
            p['image'] = copy_image(args.image, p['id'])
            if old and old.exists() and BASE / p['image'] != old:
                old.unlink()
        if args.text is None and not args.image:
            return print('что менять? дай текст или -i картинку (см. --help)')
        save(d)
        git_push(f'post: правка {p["id"]}')
        return print(f'пост {p["id"]} обновлён — на сайте появится сам')

    # закрепить/открепить существующий: --pin p2
    if args.pin and args.text and not args.image and args.text.lower() in {p['id'] for p in d['posts']}:
        p = find(d, args.text.lower())
        p['pinned'] = not p.get('pinned', False)
        save(d)
        return print(f'{p["id"]}: {"закреплён" if p["pinned"] else "откреплён"}')

    # новый пост
    text = args.text
    img = args.image
    if args.file:
        text = Path(args.file).expanduser().read_text(encoding='utf-8').strip()
    if text is None and not img and sys.stdin.isatty():
        text, img = interactive()
    text = (text or '').strip()
    if not text and not img:
        return print('пустой пост — нечего публиковать (см. --help)')

    pid = next_id(d['posts'])
    post = {
        'id': pid,
        'date': datetime.now().isoformat(timespec='seconds'),
        'text': text,
    }
    if img:
        post['image'] = copy_image(img, pid)
    if args.pin:
        post['pinned'] = True
    d['posts'].append(post)
    save(d)
    print(f'опубликован {pid}')
    if post.get('text'):
        print(f'  «{post["text"][:60]}{"…" if len(post["text"]) > 60 else ""}»')
    git_push(f'post: {pid}')


if __name__ == '__main__':
    main()
