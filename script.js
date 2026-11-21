/* ============================================================
   маршмело⁴² · @aayogima
   nothing × material 3 expressive · один экран · без 3D
   ============================================================ */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const app = $('#app');

  /* ============================================================
     1 · МАТЕРИАЛЬНЫЕ ФОРМЫ · 48-точечные полигоны
     (одинаковое число точек → clip-path плавно морфится)
     ============================================================ */
  const N = 48;
  // точки и строка полигона — точки нужны и для CSS, и для ASCII-рендера
  const ptsOf = (fn) => {
    const pts = [];
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      pts.push(fn(t));
    }
    return pts;
  };
  const polyStr = (pts) =>
    `polygon(${pts.map(([x, y]) => `${(50 + x).toFixed(2)}% ${(50 + y).toFixed(2)}%`).join(',')})`;
  const superE = (n, R) => (t) => {
    const c = Math.cos(t), s = Math.sin(t);
    const r = R / Math.pow(Math.pow(Math.abs(c), n) + Math.pow(Math.abs(s), n), 1 / n);
    return [c * r, s * r];
  };

  const SHAPE_FNS = {
    circle:   (t) => [Math.cos(t) * 34, Math.sin(t) * 34],
    squircle: superE(3.4, 37),
    pill:     (t) => [Math.cos(t) * 42, Math.sin(t) * 17],
    arch:     (t) => {
      if (t < Math.PI) return [-38 * Math.cos(t), -38 * Math.sin(t)]; // купол
      const v = (t - Math.PI) / Math.PI;                              // стенки + низ
      return [38 - v * 76, 36];
    },
    cookie:   (t) => { const m = .86 + .14 * Math.cos(12 * t); return [Math.cos(t) * 40 * m, Math.sin(t) * 40 * m]; },
    clover:   (t) => { const m = .72 + .28 * Math.cos(4 * t);  return [Math.cos(t) * 41 * m, Math.sin(t) * 41 * m]; },
    burst:    (t) => { const m = .80 + .20 * Math.cos(9 * t);  return [Math.cos(t) * 40 * m, Math.sin(t) * 40 * m]; },
    diamond:  (t) => { const r = 38 / (Math.abs(Math.cos(t)) + Math.abs(Math.sin(t))); return [Math.cos(t) * r, Math.sin(t) * r]; },
  };
  const SHAPE_PTS = Object.fromEntries(Object.entries(SHAPE_FNS).map(([k, f]) => [k, ptsOf(f)]));
  const SHAPES = Object.fromEntries(Object.entries(SHAPE_PTS).map(([k, p]) => [k, polyStr(p)]));
  const SHAPE_LIST = Object.keys(SHAPES);

  const morph = $('#morph');
  const shapeName = $('#shapeName');
  const picks = $$('.pick');

  // мини-формы в выборе и парящие декорации — те же полигоны
  picks.forEach((b) => { const s = $('.shape', b); if (s) s.style.clipPath = SHAPES[b.dataset.shape]; });
  $$('.deco .shape').forEach((s) => {
    const m = s.className.match(/shape--(\w+)/);
    if (m && SHAPES[m[1]]) s.style.clipPath = SHAPES[m[1]];
  });

  let shapeIdx = SHAPE_LIST.indexOf('cookie');
  const setShape = (key, pop = true) => {
    if (!SHAPES[key]) return;
    shapeIdx = SHAPE_LIST.indexOf(key);
    morph.style.clipPath = SHAPES[key];
    shapeName.textContent = key;
    picks.forEach((b) => b.classList.toggle('is-active', b.dataset.shape === key));
    if (pop && !reduced) {
      morph.classList.remove('pop');
      void morph.offsetWidth; // перезапуск анимации
      morph.classList.add('pop');
    }
  };
  setShape('cookie', false);

  picks.forEach((b) => b.addEventListener('click', () => setShape(b.dataset.shape)));
  if (!reduced) setInterval(() => {
    shapeIdx = (shapeIdx + 1) % SHAPE_LIST.length;
    setShape(SHAPE_LIST[shapeIdx]);
  }, 3600);

  /* ============================================================
     2 · МУЗЫКА fakemink · случайный трек при каждом заходе
     ============================================================ */
  const TRACKS = [
    { file: 'night-blooming-jasmine.mp3', title: 'Night, Blooming Jasmine', dur: 178 },
    { file: 'easter-pink.mp3',            title: 'Easter Pink',            dur: 85  },
    { file: 'ragebait.mp3',               title: 'Ragebait',               dur: 119 },
    { file: 'blow-me.mp3',                title: 'Blow Me',                dur: 131 },
    { file: 'just-kitten.mp3',            title: 'Just Kitten',            dur: 199 },
    { file: 'ym.mp3',                     title: 'Ym',                     dur: 132 },
  ];

  const audio = $('#audio');
  const pl = {
    title: $('#plTitle'), fill: $('#plFill'), bar: $('#plBar'),
    cur: $('#plCur'), dur: $('#plDur'),
    play: $('#plPlay'), icon: $('#plIcon'), prev: $('#plPrev'), next: $('#plNext'),
  };
  const ICON_PLAY = 'M8 5v14l11-7z';
  const ICON_PAUSE = 'M6 5h4v14H6zm8 0h4v14h-4z';
  const fmt = (s) => {
    if (!isFinite(s)) return '0:00';
    s = Math.max(0, Math.round(s));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  let idx = Math.floor(Math.random() * TRACKS.length);

  const loadTrack = (i, autoplay = false) => {
    idx = (i + TRACKS.length) % TRACKS.length;
    audio.src = TRACKS[idx].file;
    pl.title.textContent = TRACKS[idx].title;
    pl.dur.textContent = fmt(TRACKS[idx].dur);
    pl.fill.style.width = '0%';
    if (autoplay) audio.play().catch(() => {});
  };
  const setPlaying = (on) => {
    app.classList.toggle('is-playing', on);
    pl.icon.firstElementChild.setAttribute('d', on ? ICON_PAUSE : ICON_PLAY);
    pl.play.setAttribute('aria-label', on ? 'Пауза' : 'Играть');
  };

  audio.addEventListener('play', () => setPlaying(true));
  audio.addEventListener('pause', () => setPlaying(false));
  audio.addEventListener('ended', () => loadTrack(idx + 1, true));
  audio.addEventListener('timeupdate', () => {
    const d = audio.duration || TRACKS[idx].dur;
    pl.fill.style.width = `${(audio.currentTime / d) * 100 || 0}%`;
    pl.cur.textContent = fmt(audio.currentTime);
    if (audio.duration) pl.dur.textContent = fmt(audio.duration);
  });

  pl.play.addEventListener('click', () => audio.paused ? audio.play() : audio.pause());
  pl.prev.addEventListener('click', () => loadTrack(idx - 1, !audio.paused));
  pl.next.addEventListener('click', () => loadTrack(idx + 1, !audio.paused));
  pl.bar.addEventListener('click', (e) => {
    const r = pl.bar.getBoundingClientRect();
    const d = audio.duration || TRACKS[idx].dur;
    audio.currentTime = ((e.clientX - r.left) / r.width) * d;
  });
  pl.bar.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') audio.currentTime += 5;
    if (e.key === 'ArrowLeft')  audio.currentTime -= 5;
  });

  loadTrack(idx);
  // автозапуск; если браузер блокирует — старт после первого клика
  audio.volume = .85;
  audio.play().catch(() => {
    const once = () => { audio.play().catch(() => {}); removeEventListener('pointerdown', once); };
    addEventListener('pointerdown', once, { once: false });
  });

  /* ============================================================
     3 · ТЕРМИНАЛ · ASCII-арты: neofetch, формы, фортуны…
     ============================================================ */
  const termBody = $('#termBody');
  const MAXL = 12;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const put = (html, cls = '') => {
    const d = document.createElement('div');
    d.className = 'tl ' + cls;
    d.innerHTML = html || ' ';
    termBody.appendChild(d);
    while (termBody.children.length > MAXL) termBody.firstChild.remove();
    return d;
  };
  const typeCmd = async (cmd) => {
    const d = put('', 't-cmd');
    const p = document.createElement('span');
    p.className = 't-red';
    p.textContent = '$ ';
    const t = document.createElement('span');
    d.append(p, t);
    for (const ch of cmd) {
      t.textContent += ch;
      if (!reduced) await sleep(34);
    }
  };

  // ASCII-рендер актуальной материальной формы (из тех же точек полигона)
  const asciiShape = (key) => {
    const pts = SHAPE_PTS[key].map(([x, y]) => [50 + x, 50 + y]);
    const C = 17, R = 10;
    const inside = (px, py) => {
      let c = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
      }
      return c;
    };
    const mask = [];
    for (let r = 0; r < R; r++) {
      mask[r] = [];
      for (let c = 0; c < C; c++) mask[r][c] = inside(((c + .5) / C) * 100, ((r + .5) / R) * 100);
    }
    const rows = [];
    for (let r = 0; r < R; r++) {
      let row = '';
      for (let c = 0; c < C; c++) {
        if (!mask[r][c]) row += ' ';
        else {
          const edge = [mask[r - 1]?.[c], mask[r + 1]?.[c], mask[r]?.[c - 1], mask[r]?.[c + 1]].some((v) => !v);
          row += edge ? '▒' : '▓';
        }
      }
      rows.push(row.replace(/\s+$/, ''));
    }
    const w = Math.max(...rows.map((s) => s.length));
    return rows.map((s) => ' '.repeat((w - s.length) >> 1) + s);
  };

  const CAT = [
    '   /\\_____/\\   ',
    '  /  o   o  \\  ',
    ' ( ==  ^  == ) ',
    '  )         (  ',
    ' (           ) ',
    '( (  )   (  ) )',
    '(_(__)___(__)_)',
  ];

  const FORTUNES = [
    { q: ['«Каждый имеет право на анонимность.', 'Тот, кто её нарушает, — враг интернета.»'], by: 'marshmelo⁴² · био' },
    { q: ['«42 — ответ на главный вопрос жизни,', 'вселенной и всего такого.»'], by: 'douglas adams' },
    { q: ['«чёрное + белое = все цвета,', 'которые мне нужны.»'], by: 'nothing' },
    { q: ['«лс без звёзд — открыт всегда.»'], by: 't.me/aayogima' },
    { q: ['«форма важнее цвета.', 'особенно если это cookie.»'], by: 'material 3 expressive' },
  ];

  const scNeofetch = async () => {
    await typeCmd('neofetch');
    const info = [
      `<span class="t-hi">aayogima</span><span class="t-red">@n42</span>`,
      `<span class="t-dim">──────────────</span>`,
      `<span class="t-dim">theme</span> <span class="t-hi">black &amp; white</span>`,
      `<span class="t-dim">shell</span> <span class="t-hi">glyph-os 4.2</span>`,
      `<span class="t-dim">music</span> <span class="t-hi">${esc(pl.title.textContent || '…')}</span>`,
      `<span class="t-dim">stars</span> <span class="t-red">0</span><span class="t-dim"> · dm free</span>`,
    ];
    for (let i = 0; i < CAT.length; i++) {
      put(`<span class="t-hi">${CAT[i]}</span>  ${info[i] || ''}`);
      if (!reduced) await sleep(60);
    }
  };

  const scShapes = async () => {
    await typeCmd('shapes --ascii');
    const key = SHAPE_LIST[shapeIdx];
    for (const row of asciiShape(key)) {
      put(`<span class="t-hi">${row}</span>`);
      if (!reduced) await sleep(45);
    }
    put(`<span class="t-dim">→</span> <span class="t-red">${key}</span> <span class="t-dim">· material 3 expressive</span>`);
  };

  const scFortune = async () => {
    await typeCmd('fortune -a');
    const f = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
    for (const l of f.q) {
      put(`<span class="t-hi">${l}</span>`);
      if (!reduced) await sleep(70);
    }
    put(`<span class="t-dim">${f.by}</span>`);
  };

  const scUname = async () => {
    await typeCmd('uname -a');
    put('<span class="t-hi">GlyphOS n42.cat 4.2.0-nothing #1 SMP PREEMPT</span>');
    put('<span class="t-hi">x86_64 Cat(9) · material 3 expressive · utc+3</span>');
  };

  const scDm = async () => {
    await typeCmd('dm --cost');
    const rows = [
      ['stars ', '0', true],
      ['price ', 'free', true],
      ['route ', 't.me/aayogima', false],
      ['status ', '✓ открыт всегда', false],
    ];
    for (const [k, v, red] of rows) {
      put(`<span class="t-dim">${k}${'.'.repeat(11 - k.length)}</span> <span class="${red ? 't-red' : 't-hi'}">${v}</span>`);
      if (!reduced) await sleep(65);
    }
  };

  (async () => {
    await sleep(500);
    put('<span class="t-dim">boot ok · welcome to n42</span>');
    await sleep(reduced ? 100 : 900);
    const scenes = [scNeofetch, scShapes, scFortune, scUname, scDm];
    let i = 0;
    while (true) {
      await scenes[i % scenes.length]();
      i++;
      await sleep(reduced ? 5000 : 3400);
      put('');
    }
  })();

  /* ============================================================
     4 · ЧАСЫ · МСК (utc+3)
     ============================================================ */
  const clock = $('#clock');
  const tz = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const tick = () => clock.textContent = tz.format(new Date());
  tick(); setInterval(tick, 1000);

  /* ============================================================
     5 · КОПИРОВАНИЕ + SNACKBAR (M3)
     ============================================================ */
  const snack = $('#snackbar');
  let snackT;
  const toast = (msg) => {
    snack.textContent = msg;
    snack.classList.add('show');
    clearTimeout(snackT);
    snackT = setTimeout(() => snack.classList.remove('show'), 2400);
  };
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); ta.remove();
    }
    toast(`скопировано: ${text.length > 40 ? text.slice(0, 38) + '…' : text}`);
  };
  $$('[data-copy]').forEach((b) => b.addEventListener('click', () => copy(b.dataset.copy)));

  /* ============================================================
     6 · RIPPLE (M3)
     ============================================================ */
  $$('.ripple').forEach((b) => b.addEventListener('pointerdown', (e) => {
    const r = b.getBoundingClientRect();
    const d = Math.max(r.width, r.height);
    const ink = document.createElement('span');
    ink.className = 'ink';
    ink.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    b.appendChild(ink);
    setTimeout(() => ink.remove(), 650);
  }));

  /* ============================================================
     7 · ТЕМА · ч/б инверсия (кнопка в шапке, localStorage, #light/#dark)
     ============================================================ */
  const root = document.documentElement;
  const metaTheme = $('#metaTheme');
  const applyTheme = (t) => {
    root.dataset.theme = t;
    if (metaTheme) metaTheme.content = t === 'light' ? '#f6f6f6' : '#050505';
  };
  let theme = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  try { theme = localStorage.getItem('theme') || theme; } catch {}
  const hash = location.hash.match(/light|dark/);
  if (hash) theme = hash[0];
  applyTheme(theme);
  $('#themeBtn').addEventListener('click', () => {
    theme = theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('theme', theme); } catch {}
    applyTheme(theme);
    toast(theme === 'light' ? 'тема: светлая · инверсия' : 'тема: тёмная');
  });

  /* ============================================================
     8 · ПОСТЫ · posts.json (постит — post.py)
     + глобальный режим: если есть firebase-config.js —
       лайки и комментарии живут в Firebase и видны всем live
     ============================================================ */
  const postsSection = $('#posts');
  const feed = $('#feed');
  const pad2 = (s) => String(s).padStart(2, '0');
  const linkify = (s) => esc(s)
    .replace(/(https?:\/\/[^\s<]+)/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`)
    .replace(/\n/g, '<br>');
  const fmtDate = (iso) => new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));

  /* ---------- Firebase (глобальные лайки/комментарии) ---------- */
  const loadScript = (src) => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  let fb = null;                 // { db } — если null, работаем локально
  let fbUnsubs = [];             // отписки live-слушателей
  const fbReady = loadScript('firebase-config.js')
    .then(() => {
      if (!window.FB_CONFIG) return null;
      return Promise.all([
        loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js'),
        loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js'),
      ]).then(() => {
        firebase.initializeApp(window.FB_CONFIG);
        fb = { db: firebase.firestore() };
        // лента уже могла отрисоваться — навешиваем live сейчас
        $$('.post', feed).forEach(attachLive);
      });
    })
    .catch(() => {});            // нет конфига → локальный режим

  function attachLive(art) {
    if (!fb || !art || art.dataset.live === '1') return;
    art.dataset.live = '1';
    art.classList.add('is-global');      // прячет «комментировать в тг»
    const id = art.dataset.id;
    const slot = $('.pc-slot', art);
    if (slot) slot.innerHTML = chatUser ? `
      <form class="pc-form">
        <input name="text" placeholder="комментарий…" maxlength="500" autocomplete="off" required>
        <button type="submit" class="pc-send">отправить</button>
      </form>` : `
      <button class="pc-login mono" type="button">войти через тг, чтобы комментировать</button>`;
    // лайки: живой счётчик
    fbUnsubs.push(fb.db.doc(`posts/${id}`).onSnapshot(
      (s) => { const el = $('.like-n', art); if (el) el.textContent = (s.exists ? s.data().likes || 0 : 0); },
      () => {},
    ));
    // комментарии: живой список
    const live = $('.pc-live', art);
    fbUnsubs.push(fb.db.collection(`posts/${id}/comments`).orderBy('date').onSnapshot(
      (snap) => {
        if (!live) return;
        if (snap.empty) { live.hidden = true; return; }
        live.hidden = false;
        live.innerHTML = snap.docs.map((dc) => {
          const c = dc.data();
          const admin = (c.username || '').toLowerCase() === 'aayogima';
          return `<div class="pc"><b>${esc(c.by || 'аноним')}</b>${admin ? '<span class="msg-admin">админ</span>' : ''}<span>${linkify(c.text)}</span></div>`;
        }).join('');
      },
      () => {},
    ));
  }

  // загрузка постов + живое обновление: раз в 15с сверяем posts.json
  let postsSig = '';
  const loadPosts = () => fetch(`posts.json?t=${Date.now()}`, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      const posts = (d && d.posts) || [];
      if (!posts.length) return;
      const sig = JSON.stringify(posts);
      if (sig === postsSig) return;   // ничего не изменилось
      postsSig = sig;
      fbUnsubs.forEach((u) => { try { u(); } catch {} });   // старые слушатели долой
      fbUnsubs = [];
      posts.sort((a, b) => ((b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)) || (new Date(b.date) - new Date(a.date)));
      feed.innerHTML = '';
      for (const p of posts) {
        const art = document.createElement('article');
        art.className = 'post';
        art.dataset.id = esc(p.id);
        const num = String(p.id || '').replace(/\D/g, '');
        const liked = (() => { try { return !!localStorage.getItem('liked:' + p.id); } catch { return false; } })();
        const likeN = (p.likes || 0) + (liked && !fb ? 1 : 0);
        art.innerHTML = `
          <header class="post-meta mono">
            <span class="post-id">#${pad2(num)}</span>
            <time class="post-time">${fmtDate(p.date)}</time>
            ${p.pinned ? '<span class="post-pin"><i class="rec-dot rec-dot--sm" aria-hidden="true"></i>вверху</span>' : ''}
          </header>
          ${p.text ? `<div class="post-text">${linkify(p.text)}</div>` : ''}
          ${p.image ? `<img class="post-img" src="${esc(p.image)}?v=${postsSig.length}${Date.now() % 97}" alt="${esc((p.text || 'пост').slice(0, 80))}" loading="lazy">` : ''}
          ${(p.comments && p.comments.length) ? `<div class="post-comments">${
            p.comments.map((c) => `<div class="pc"><b>${esc(c.by || 'аноним')}</b><span>${linkify(c.text)}</span></div>`).join('')
          }</div>` : ''}
          <div class="pc-live" hidden></div>
          <div class="post-foot">
            <button class="post-like${liked ? ' is-liked' : ''}" data-id="${esc(p.id)}" aria-label="Лайк посту ${esc(p.id)}">
              <span class="like-heart" aria-hidden="true">♥</span><span class="like-n">${likeN}</span>
            </button>
            <a class="post-tg" href="https://t.me/aayogima?free=zUEtBAujyA53A8gD" target="_blank" rel="noopener">комментировать в тг</a>
          </div>
          <div class="pc-slot"></div>`;
        feed.appendChild(art);
        attachLive(art);
      }
      postsSection.hidden = false;
    })
    .catch(() => {});
  loadPosts();
  setInterval(loadPosts, 15000);

  // лайки: с базой — глобально (видно всем), без — локально
  feed.addEventListener('click', (e) => {
    const btn = e.target.closest('.post-like');
    if (!btn) return;
    const id = btn.dataset.id;
    let liked;
    try { liked = !!localStorage.getItem('liked:' + id); } catch { liked = false; }
    try {
      if (liked) localStorage.removeItem('liked:' + id);
      else localStorage.setItem('liked:' + id, '1');
    } catch {}
    btn.classList.toggle('is-liked', !liked);
    if (fb) {
      const doc = fb.db.doc(`posts/${id}`);
      fb.db.runTransaction((t) => t.get(doc).then((s) => {
        const cur = s.exists ? s.data().likes || 0 : 0;
        t.set(doc, { likes: Math.max(0, cur + (liked ? -1 : 1)) }, { merge: true });
      })).catch(() => toast('не отправилось — попробуй ещё'));
    } else {
      const nEl = $('.like-n', btn);
      const n = parseInt(nEl.textContent, 10) || 0;
      nEl.textContent = n + (liked ? -1 : 1);
    }
  });

  // вход для комментирования: открывает чат, где кнопка входа
  feed.addEventListener('click', (e) => {
    if (e.target.closest('.pc-login')) openChat();
  });

  /* ---------- анти-спам: 5 сек между отправками (админ/⭐vip — без него) ---------- */
  let cdUntil = 0;
  let cdTimer = null;
  let vipNames = new Set();
  const isVip = () => {
    const u = ((chatUser && chatUser.username) || '').toLowerCase();
    return isAdmin(chatUser || {}) || vipNames.has(u);
  };
  const cdLeft = () => (isVip() ? 0 : Math.max(0, Math.ceil((cdUntil - Date.now()) / 1000)));
  const cdBlockToast = () => toast('анти-спам: подожди ' + cdLeft() + ' сек · убрать таймер — 15 ⭐ в подарок @aayogima');
  const cdStart = (btn) => {
    cdUntil = Date.now() + 5000;
    if (!btn) return;
    const orig = 'отправить';
    const tick = () => {
      const left = cdLeft();
      if (left <= 0 || isVip()) { clearInterval(cdTimer); cdTimer = null; btn.textContent = orig; btn.disabled = false; return; }
      btn.textContent = left + ' сек'; btn.disabled = true;
    };
    if (cdTimer) clearInterval(cdTimer);
    tick(); cdTimer = setInterval(tick, 1000);
  };

  // отправка комментария (только после входа через тг)
  feed.addEventListener('submit', (e) => {
    const form = e.target.closest('.pc-form');
    if (!form || !fb || !chatUser) return;
    e.preventDefault();
    if (cdLeft() > 0) return cdBlockToast();
    const art = form.closest('.post');
    const by = chatUser.name.slice(0, 60);
    const text = (form.text.value || '').trim().slice(0, 500);
    if (!text) return;
    const sendBtn = $('.pc-send', form);
    sendBtn.textContent = '…';
    fb.db.collection(`posts/${art.dataset.id}/comments`).add({
      by, username: chatUser.username || '', uid: chatUser.uid, text, date: new Date().toISOString(),
    })
      .then(() => { form.text.value = ''; sendBtn.textContent = '✓'; setTimeout(() => sendBtn.textContent = 'отправить', 1200); cdStart(sendBtn); })
      .catch(() => { sendBtn.textContent = '×'; setTimeout(() => sendBtn.textContent = 'отправить', 1500); toast('комментарий не ушёл — попробуй ещё'); });
  });

  // лайтбокс: клик по картинке — фуллскрин, клик/Esc — закрыть
  const lb = $('#lightbox');
  const lbImg = $('#lightboxImg');
  const closeLb = () => { lb.classList.remove('show'); lb.setAttribute('aria-hidden', 'true'); };
  feed.addEventListener('click', (e) => {
    const img = e.target.closest('.post-img');
    if (!img) return;
    lbImg.src = img.src;
    lb.classList.add('show');
    lb.setAttribute('aria-hidden', 'false');
  });
  lb.addEventListener('click', closeLb);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLb(); });

  /* ============================================================
     9 · ГЛОБАЛЬНЫЙ ЧАТ · вход через Telegram (Login Widget)
     требует chat-config.js (post.py --chat бот_юзернейм)
     ============================================================ */
  const chat = $('#chat');
  const chatFab = $('#chatFab');
  const chatBadge = $('#chatBadge');
  const chatLog = $('#chatLog');
  const chatCount = $('#chatCount');
  const chatForm = $('#chatForm');
  const chatLogin = $('#chatLogin');
  const chatMe = $('#chatMe');

  let chatUser = null;
  try { chatUser = JSON.parse(localStorage.getItem('tguser') || 'null'); } catch {}
  const isAdmin = (m) => (m.username || '').toLowerCase() === 'aayogima'
    || (window.CHAT_CONFIG && window.CHAT_CONFIG.adminId && m.uid === window.CHAT_CONFIG.adminId);

  const chatSeen = () => { try { return +localStorage.getItem('chatSeen') || 0; } catch { return 0; } };

  // логин: телеграм-виджет вызывает глобальную onTelegramAuth
  window.onTelegramAuth = (user) => {
    chatUser = { uid: user.id, name: user.first_name || user.username || 'анон', username: user.username || '', photo: user.photo_url || '' };
    try { localStorage.setItem('tguser', JSON.stringify(chatUser)); } catch {}
    syncChatLogin();
    postsSig = ''; loadPosts();   // перерисовать посты: появились формы комментариев
    toast(`привет, ${chatUser.name} 👋`);
  };

  const syncChatLogin = () => {
    if (chatUser) {
      chatForm.hidden = false;
      chatLogin.hidden = true;
      chatMe.hidden = false;
      chatMe.innerHTML = `ты: <b>${esc(chatUser.name)}</b> ${chatUser.username ? '@' + esc(chatUser.username) : ''} · <u id="chatOut" style="cursor:pointer">выйти</u>`;
      $('#chatOut').addEventListener('click', () => {
        chatUser = null;
        try { localStorage.removeItem('tguser'); } catch {}
        syncChatLogin();
        postsSig = ''; loadPosts();   // убрать формы комментариев
      });
    } else {
      chatForm.hidden = true;
      chatLogin.hidden = false;
      chatMe.hidden = true;
    }
  };
  syncChatLogin();

  // открытие/закрытие
  const openChat = () => { chat.hidden = false; chatFab.hidden = true; chatBadge.hidden = true; try { localStorage.setItem('chatSeen', Date.now()); } catch {} if ($('#chatText')) $('#chatText').focus(); };
  const closeChat = () => { chat.hidden = true; chatFab.hidden = false; };
  chatFab.addEventListener('click', openChat);
  $('#chatClose').addEventListener('click', closeChat);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !chat.hidden) closeChat(); });

  const fmtTime = (iso) => new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

  const renderChat = (docs) => {
    const seen = chatSeen();
    let unread = 0;
    chatLog.innerHTML = '';
    for (const dc of docs) {
      const m = dc.data();
      const t = new Date(m.date).getTime() || 0;
      if (t > seen) unread++;
      const own = chatUser && m.uid === chatUser.uid;
      const div = document.createElement('div');
      div.className = 'msg' + (own ? ' own' : '');
      div.innerHTML = `
        ${m.photo
          ? `<img class="msg-ava" src="${esc(m.photo)}" alt="" loading="lazy">`
          : `<span class="msg-ava msg-ava--dot" aria-hidden="true">${esc((m.name || '?').slice(0, 1).toUpperCase())}</span>`}
        <div class="msg-body">
          <div class="msg-head">
            <span class="msg-name">${esc(m.name || 'анон')}</span>
            ${isAdmin(m) ? '<span class="msg-admin">админ</span>' : ''}
            <span class="msg-time mono">${fmtTime(m.date)}</span>
          </div>
          <div class="msg-text">${linkify(m.text)}</div>
        </div>`;
      chatLog.appendChild(div);
    }
    const empty = $('.chat-empty');
    if (empty) empty.remove();
    chatCount.textContent = docs.length;
    chatLog.scrollTop = chatLog.scrollHeight;
    // бейдж непрочитанных (только когда чат закрыт)
    if (!chatFab.hidden && unread > 0) { chatBadge.textContent = unread > 99 ? '99+' : unread; chatBadge.hidden = false; }
  };

  const initChat = () => {
    const bot = window.CHAT_CONFIG && window.CHAT_CONFIG.bot;
    if (!bot) return;                       // чат ещё не настроен — кнопки нет
    chatFab.hidden = false;

    // виджет входа
    const s = document.createElement('script');
    s.src = 'https://telegram.org/js/telegram-widget.js?22';
    s.async = true;
    s.setAttribute('data-telegram-login', bot);
    s.setAttribute('data-size', 'large');
    s.setAttribute('data-userpic', 'true');
    s.setAttribute('data-radius', '16');
    s.setAttribute('data-onauth', 'onTelegramAuth(user)');
    s.setAttribute('data-request-access', 'write');
    $('#tgWidget').appendChild(s);

    // живые сообщения + белый список vip (кому снят таймер)
    fbReady.then(() => {
      if (!fb) return;
      fb.db.collection('vip').onSnapshot(
        (s) => { vipNames = new Set(s.docs.map((d) => d.id.toLowerCase())); const g = $('#chatGift'); if (g) g.hidden = isVip(); },
        () => {},
      );
      fb.db.collection('chat').orderBy('date').limitToLast(120).onSnapshot(
        (snap) => renderChat(snap.docs),
        () => {},
      );
    });
  };
  loadScript('chat-config.js').then(initChat).catch(() => {});

  // отправка
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#chatText');
    const text = (input.value || '').trim().slice(0, 500);
    if (!text || !fb || !chatUser) return;
    if (cdLeft() > 0) return cdBlockToast();
    const btn = $('.pc-send', chatForm);
    btn.textContent = '…';
    fb.db.collection('chat').add({
      uid: chatUser.uid, name: chatUser.name, username: chatUser.username,
      photo: chatUser.photo, text, date: new Date().toISOString(),
    })
      .then(() => { input.value = ''; input.focus(); btn.textContent = '✓'; setTimeout(() => btn.textContent = 'отправить', 1000); try { localStorage.setItem('chatSeen', Date.now()); } catch {} cdStart(btn); })
      .catch(() => { btn.textContent = '×'; setTimeout(() => btn.textContent = 'отправить', 1500); toast('сообщение не ушло — попробуй ещё'); });
  });
})();
