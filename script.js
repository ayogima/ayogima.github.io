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
    { file: 'assets/music/night-blooming-jasmine.mp3', title: 'Night, Blooming Jasmine', dur: 178 },
    { file: 'assets/music/easter-pink.mp3',            title: 'Easter Pink',            dur: 85  },
    { file: 'assets/music/ragebait.mp3',               title: 'Ragebait',               dur: 119 },
    { file: 'assets/music/blow-me.mp3',                title: 'Blow Me',                dur: 131 },
    { file: 'assets/music/just-kitten.mp3',            title: 'Just Kitten',            dur: 199 },
    { file: 'assets/music/ym.mp3',                     title: 'Ym',                     dur: 132 },
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
     8 · ПОСТЫ · assets/posts/posts.json (постит — post.py)
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

  fetch('assets/posts/posts.json', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      const posts = (d && d.posts) || [];
      if (!posts.length) return;
      posts.sort((a, b) => ((b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)) || (new Date(b.date) - new Date(a.date)));
      for (const p of posts) {
        const art = document.createElement('article');
        art.className = 'post';
        const num = String(p.id || '').replace(/\D/g, '');
        art.innerHTML = `
          <header class="post-meta mono">
            <span class="post-id">#${pad2(num)}</span>
            <time class="post-time">${fmtDate(p.date)}</time>
            ${p.pinned ? '<span class="post-pin"><i class="rec-dot rec-dot--sm" aria-hidden="true"></i>вверху</span>' : ''}
          </header>
          ${p.text ? `<div class="post-text">${linkify(p.text)}</div>` : ''}
          ${p.image ? `<img class="post-img" src="${esc(p.image)}" alt="${esc((p.text || 'пост').slice(0, 80))}" loading="lazy">` : ''}`;
        feed.appendChild(art);
      }
      postsSection.hidden = false;
    })
    .catch(() => {});

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
})();
