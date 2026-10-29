/* ナビ・出現・新幹線のスクラブ・Works・Journey・カウント・メール（仕様書 §5〜§6） */
(function () {
  'use strict';

  var root = document.documentElement;
  var RM = root.classList.contains('rm');
  var D = window.ALCEDO_DATA || null;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };
  var TAN12 = Math.tan(12 * Math.PI / 180);

  // 初期化を個別に守る（1つ失敗しても他は動かす）
  function safe(name, fn) {
    try { fn(); } catch (e) { console.error('main.js [' + name + ']:', e); }
  }

  function h(tag, attrs) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') el.textContent = attrs[k];
      else if (k === 'class') el.className = attrs[k];
      else el.setAttribute(k, attrs[k]);
    });
    for (var i = 2; i < arguments.length; i++) if (arguments[i]) el.appendChild(arguments[i]);
    return el;
  }

  /* ---------- 画像の読み込み失敗 ---------- */
  safe('images', function () {
    $$('img').forEach(function (img) {
      var fail = function () { img.classList.add('img-failed'); };
      img.addEventListener('error', fail);
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fail();
    });
  });

  /* ---------- 見出しの文字分割 ---------- */
  function splitChars(el) {
    var label = el.textContent.trim();
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          Array.from(c.textContent).forEach(function (ch) {
            var s = document.createElement('span');
            s.className = 'ch';
            s.setAttribute('aria-hidden', 'true');
            s.style.setProperty('--i', String(i++));
            s.textContent = ch;
            frag.appendChild(s);
          });
          c.parentNode.replaceChild(frag, c);
        } else if (c.nodeType === 1) walk(c);
      });
    })(el);
    var sr = h('span', { 'class': 'sr-only', text: label });
    el.insertBefore(sr, el.firstChild);
  }
  safe('split', function () { $$('[data-split]').forEach(splitChars); });

  /* ---------- データから描画 ---------- */
  safe('members', function () {
    var ul = $('#memberList');
    if (!ul || !D || !Array.isArray(D.members)) return;
    D.members.forEach(function (m) {
      var li = h('li', { 'class': 'member', 'data-reveal': '' },
        h('span', { 'class': 'dot dot--' + (m.dot || 'blue'), 'aria-hidden': 'true' }),
        h('p', { 'class': 'member__name', text: m.name }),
        m.role ? h('p', { 'class': 'member__role', text: m.role }) : null,
        m.note ? h('p', { 'class': 'member__note', text: m.note }) : null);
      if (m.links && m.links.length) {
        var box = h('p', { 'class': 'member__links' });
        m.links.forEach(function (l) { box.appendChild(h('a', { 'class': 'link-beak', href: l.url, target: '_blank', rel: 'noopener', text: l.label })); });
        li.appendChild(box);
      }
      ul.appendChild(li);
    });
  });

  safe('stats', function () {
    if (!D || !D.works) return;
    $$('[data-stats]').forEach(function (box) {
      var w = D.works[box.getAttribute('data-stats')];
      if (!w) return;
      w.stats.forEach(function (s) {
        var num = h('p', { 'class': 'stat__num' });
        s.values.forEach(function (v, i) {
          if (i > 0) num.appendChild(h('span', { 'class': 'arrow', 'aria-hidden': 'true', text: s.sep || '→' }));
          num.appendChild(h('span', { 'class': 'num', 'data-to': String(v), text: String(v) }));
        });
        if (s.unit) num.appendChild(h('span', { 'class': 'unit', text: s.unit }));
        box.appendChild(h('div', { 'class': 'stat' }, num, h('p', { 'class': 'stat__label', text: s.label })));
      });
    });
  });

  safe('journey-render', function () {
    var ol = $('#stations');
    if (!ol || !D || !Array.isArray(D.journey)) return;
    D.journey.forEach(function (j) {
      ol.appendChild(h('li', { 'class': 'station' + (j.next ? ' station--next' : '') },
        h('span', { 'class': 'station__dot', 'aria-hidden': 'true' }),
        h('div', { 'class': 'station__body' },
          h('p', { 'class': 'station__date', text: j.date }),
          h('p', { 'class': 'station__text', text: j.text }))));
    });
  });

  /* ---------- スクロール出現 ---------- */
  safe('reveal', function () {
    var items = $$('[data-reveal]:not([data-hero]), [data-split]:not([data-hero])');
    var groups = new Map();
    items.forEach(function (el) {
      var sec = el.closest('section') || document.body;
      var n = groups.get(sec) || 0;
      groups.set(sec, n + 1);
      el.style.setProperty('--d', String(Math.min(n, 5)));
    });
    var showAll = function () { items.forEach(function (el) { el.classList.add('is-in'); }); };
    if (RM || !('IntersectionObserver' in window)) { showAll(); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  });

  /* ---------- カウントアップ ---------- */
  var counted = new WeakSet();
  function countUp(scope) {
    $$('.num[data-to]', scope).forEach(function (el) {
      if (counted.has(el)) return;
      counted.add(el);
      var to = Number(el.getAttribute('data-to'));
      if (RM || !isFinite(to)) { el.textContent = String(to); return; }
      var t0 = null, dur = 900;
      el.textContent = '0';
      requestAnimationFrame(function step(now) {
        if (t0 === null) t0 = now;
        var k = clamp((now - t0) / dur, 0, 1);
        el.textContent = String(Math.round(to * easeOutCubic(k)));
        if (k < 1) requestAnimationFrame(step);
      });
    });
  }

  /* ---------- Works（連結した車両）---------- */
  safe('works', function () {
    var track = $('#track');
    if (!track) return;
    var cars = $$('.car', track);
    var prev = $('#worksPrev'), next = $('#worksNext');

    cars.forEach(function (car) {
      var btn = $('.more', car);
      if (!btn) return;
      btn.addEventListener('click', function () {
        var open = !car.classList.contains('is-open');
        cars.forEach(function (c) {
          c.classList.remove('is-open');
          var b = $('.more', c);
          if (b) { b.setAttribute('aria-expanded', 'false'); $('.more__t', b).textContent = '詳しく見る'; }
        });
        if (open) {
          car.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
          $('.more__t', btn).textContent = '閉じる';
          countUp(car);
        }
        track.classList.toggle('has-open', open);
      });
    });

    function go(dir) {
      var cur = 0, best = Infinity;
      cars.forEach(function (c, i) {
        var d = Math.abs(c.offsetLeft - parseFloat(getComputedStyle(track).paddingLeft) - track.scrollLeft);
        if (d < best) { best = d; cur = i; }
      });
      var to = clamp(cur + dir, 0, cars.length - 1);
      var pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      track.scrollTo({ left: cars[to].offsetLeft - pad, behavior: RM ? 'auto' : 'smooth' });
    }
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
    track.addEventListener('keydown', function (e) {
      if (e.target !== track) return; // 車両内のボタンやリンクの操作は邪魔しない
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });

    // 軽量な動画埋め込み（クリックするまで iframe を置かない）
    $$('.video').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-yt');
        if (!id) return;
        var f = document.createElement('iframe');
        f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1';
        f.title = 'Astera 紹介動画';
        f.allow = 'autoplay; encrypted-media; picture-in-picture';
        f.setAttribute('allowfullscreen', '');
        b.textContent = '';
        b.appendChild(f);
        b.disabled = true;
      });
    });
  });

  /* ---------- メール ---------- */
  safe('mail', function () {
    var a = $('#mailLink'), cp = $('#mailCopy'), st = $('#mailStatus');
    if (!a || !D || !Array.isArray(D.mail) || D.mail.length !== 2) return;
    var addr = D.mail[0] + '@' + D.mail[1];
    a.href = 'mailto:' + addr;
    a.textContent = addr;
    a.hidden = false;
    if (cp) cp.hidden = false;
    var timer = null;
    var say = function (msg) {
      if (!st) return;
      st.textContent = msg;
      clearTimeout(timer);
      timer = setTimeout(function () { st.textContent = ''; }, 1500);
    };
    var fallbackCopy = function () {
      var ta = document.createElement('textarea');
      ta.value = addr; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    };
    if (cp) cp.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(addr).then(function () { say('コピーしました'); }, function () { say(fallbackCopy() ? 'コピーしました' : 'コピーできませんでした'); });
      } else say(fallbackCopy() ? 'コピーしました' : 'コピーできませんでした');
    });
  });

  /* ---------- ナビ（現在の節に下線）---------- */
  var navLinks = $$('#navLinks a[data-nav]');
  var navBar = $('#navBar');
  var navWrap = $('#navLinks');
  var sections = navLinks.map(function (a) { return document.getElementById(a.getAttribute('data-nav')); });
  var activeIdx = -2;
  function updateNav() {
    if (!navBar || !sections.length) return;
    var line = window.innerHeight * 0.4, idx = -1;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= line) idx = i; });
    if (idx === activeIdx) return;
    activeIdx = idx;
    navLinks.forEach(function (a, i) { if (i === idx) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    if (idx < 0) { navBar.style.opacity = '0'; return; }
    var a = navLinks[idx];
    navBar.style.opacity = '1';
    navBar.style.left = a.offsetLeft + 'px';
    navBar.style.width = a.offsetWidth + 'px';
    if (navWrap && navWrap.scrollWidth > navWrap.clientWidth) {
      navWrap.scrollTo({ left: a.offsetLeft - (navWrap.clientWidth - a.offsetWidth) / 2, behavior: RM ? 'auto' : 'smooth' });
    }
  }

  // SVG は offsetWidth を持たないので、CSS の幅と viewBox の比から求める（回転の影響を受けない）
  function trainSize(el) {
    var w = parseFloat(getComputedStyle(el).width) || 150;
    return { w: w, h: w * 46 / 260 };
  }

  /* ---------- 斜めの境目を横切る新幹線（スクラブ）---------- */
  var lanes = $$('[data-lane]').map(function (lane) {
    return { lane: lane, train: $('.train', lane), probe: $('.lane__probe', lane) };
  });
  function updateLanes() {
    if (RM) return;
    var vh = window.innerHeight;
    lanes.forEach(function (o) {
      if (!o.train) return;
      var rect = o.lane.getBoundingClientRect();
      var p = clamp((vh - rect.top) / (vh * 0.95), 0, 1);
      var W = o.lane.clientWidth;
      var cut = o.probe ? o.probe.offsetHeight : 40;
      var run = cut / TAN12;
      var sz = trainSize(o.train), w = sz.w, hh = sz.h;
      var cx = lerp(-w, W + w, p);
      // 境目の高さ: 平らな部分は 0、斜面（12°）では上へ
      var edge = function (x) { return -clamp((x - (W - run)) * TAN12, 0, cut); };
      var yf = edge(cx + w * 0.35), yr = edge(cx - w * 0.35);
      var ang = Math.atan2(yf - yr, w * 0.7) * 180 / Math.PI;
      var yc = (yf + yr) / 2;
      o.train.style.opacity = (p <= 0 || p >= 1) ? '0' : '1';
      o.train.style.transform = 'translate(' + (cx - w / 2) + 'px,' + (yc - hh + 3) + 'px) rotate(' + ang + 'deg)';
    });
  }

  /* ---------- Journey（線路と新幹線）---------- */
  var jtrack = $('#jtrack'), jtrain = $('#jtrain');
  function updateJourney() {
    if (!jtrack || !jtrain) return;
    var stations = $$('.station', jtrack);
    if (!stations.length) return;
    if (RM) { stations.forEach(function (s) { s.classList.add('is-passed'); }); return; }
    var vh = window.innerHeight;
    var r = jtrack.getBoundingClientRect();
    var p = clamp((vh * 0.8 - r.top) / (r.height + vh * 0.3), 0, 1);
    var vertical = getComputedStyle($('.rail__v', jtrack)).display !== 'none';
    var sz = trainSize(jtrain), tw = sz.w, th = sz.h;
    var pts = stations.map(function (s) { return vertical ? s.offsetTop + 14 : s.offsetLeft + 12; });
    var lastIdx = Math.max(0, stations.length - 2); // 最後は「次の駅」。そこまでは進まない
    var c = lerp(pts[0] - tw * 0.8, pts[lastIdx] + 16, p);
    jtrain.style.opacity = p <= 0.001 ? '0' : '1';
    if (vertical) {
      jtrain.style.transform = 'translate(' + (12 - tw / 2) + 'px,' + (c - th / 2) + 'px) rotate(90deg)';
    } else {
      jtrain.style.transform = 'translate(' + (c - tw / 2) + 'px,' + (3 - th / 2 + 12 - 4) + 'px)';
    }
    stations.forEach(function (s, i) {
      if (i < stations.length - 1 && c >= pts[i]) s.classList.add('is-passed'); else s.classList.remove('is-passed');
    });
  }

  /* ---------- スクロール・リサイズの共通ハンドラ ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      safe('nav', updateNav);
      safe('lanes', updateLanes);
      safe('journey', updateJourney);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { activeIdx = -2; onScroll(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { activeIdx = -2; onScroll(); });
  updateNav(); updateLanes(); updateJourney();
  window.__alcedoReady = true;
})();
