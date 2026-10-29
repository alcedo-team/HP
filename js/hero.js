/* ヒーローの飛翔（仕様書 §6-1）。SVG のカワセミが左下から右上へ抜け、着地して「？」→「！」 */
(function () {
  'use strict';

  var root = document.documentElement;
  var hero = document.getElementById('top');
  var layer = document.querySelector('.flight');
  var bird = layer && layer.querySelector('.flight__bird');
  var veil = layer && layer.querySelector('.flight__veil');
  var charBox = document.getElementById('heroChar');
  if (!hero) return;

  var heroItems = Array.prototype.slice.call(document.querySelectorAll('[data-hero]'));

  // 全て最終状態にする（動き抑制・失敗時のフォールバック）
  function showAll() {
    hero.classList.add('is-land', 'is-q', 'is-e', 'is-done');
    heroItems.forEach(function (el) { el.classList.add('is-in'); });
    if (layer) layer.hidden = true;
  }

  if (root.classList.contains('rm') || !layer || !bird || !charBox) { showAll(); return; }

  try {
    var seen = false;
    try {
      seen = !!sessionStorage.getItem('alcedoSeen');
      sessionStorage.setItem('alcedoSeen', '1');
    } catch (e) { /* sessionStorage が使えなくても通常版で進める */ }

    // 時刻表（秒）。短縮版は飛翔を 0.9s にし、以降は同じ間隔
    var T = seen
      ? { veilA: 0.05, veilB: 0.45, leg1: 0.6, leg2: 0.9, cross: 0.55, q: 0.9, e: 1.5, end: 1.9, l1: 0.2, rest: 0.5 }
      : { veilA: 0.5, veilB: 1.3, leg1: 1.5, leg2: 2.2, cross: 1.85, q: 2.2, e: 2.8, end: 3.2, l1: 0.9, rest: 1.9 };

    var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
    var easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };
    var bez = function (p0, p1, p2, p3, t) {
      var u = 1 - t;
      return {
        x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
        y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
      };
    };

    var W = window.innerWidth, H = window.innerHeight;
    var cr = charBox.getBoundingClientRect();
    var baseW = clamp(cr.width * 1.03, 240, 560); // 着地で 0.6 倍になるので、着地先の絵に合わせて大きめに始める
    var baseH = baseW * (200 / 300);
    bird.style.width = baseW + 'px';
    bird.style.height = baseH + 'px';

    // 軌道（% を px に換算）: M -12 108 C 20 95, 45 60, 62 38
    var P0 = { x: -0.12 * W, y: 1.08 * H }, C1 = { x: 0.20 * W, y: 0.95 * H };
    var C2 = { x: 0.45 * W, y: 0.60 * H }, P3 = { x: 0.62 * W, y: 0.38 * H };

    var done = { items: {}, land: false, q: false, e: false, fin: false };
    var l1 = document.querySelector('[data-hero="l1"]');
    var l2 = document.querySelector('[data-hero="l2"]');
    var others = heroItems.filter(function (el) { return el !== l1 && el !== l2; });
    var start = null;

    function frame(now) {
      if (start === null) start = now;
      var t = (now - start) / 1000;

      // 幕（クリーム）は薄れていく。ページはスクロール可能
      veil.style.opacity = String(1 - clamp((t - T.veilA) / (T.veilB - T.veilA), 0, 1));

      // 位置・回転・大きさ
      var pos, rot, scale = 1;
      if (t < T.leg1) {
        var k = t / T.leg1;
        pos = bez(P0, C1, C2, P3, k);
        var q = bez(P0, C1, C2, P3, Math.min(1, k + 0.02));
        rot = Math.atan2(q.y - pos.y, q.x - pos.x) * 180 / Math.PI;
      } else {
        var k2 = easeOutCubic(clamp((t - T.leg1) / (T.leg2 - T.leg1), 0, 1));
        var r = charBox.getBoundingClientRect(); // スクロールされても追従
        var L = { x: r.left + r.width * 0.5, y: r.top + r.height * 0.55 };
        var D1 = { x: P3.x + 0.10 * W, y: P3.y - 0.06 * H };
        var D2 = { x: L.x + 0.04 * W, y: L.y - 0.16 * H };
        pos = bez(P3, D1, D2, L, k2);
        var q2 = bez(P3, D1, D2, L, Math.min(1, k2 + 0.03));
        var ang = Math.atan2(q2.y - pos.y, q2.x - pos.x) * 180 / Math.PI;
        rot = clamp(ang, -40, 40) * (1 - k2 * 0.9);
        scale = 1 - 0.4 * k2;
      }
      rot = clamp(rot, -45, 45);
      bird.style.transform = 'translate(' + (pos.x - baseW / 2) + 'px,' + (pos.y - baseH / 2) + 'px) rotate(' + rot + 'deg) scale(' + scale + ')';
      bird.style.opacity = String(1 - clamp((t - T.cross) / 0.35, 0, 1));

      // イベント
      if (!done.items.eyebrow && t >= T.l1 - 0.1) { done.items.eyebrow = true; if (others[0]) others[0].classList.add('is-in'); }
      if (!done.items.l1 && t >= T.l1) { done.items.l1 = true; if (l1) l1.classList.add('is-in'); }
      if (!done.land && t >= T.cross) { done.land = true; hero.classList.add('is-land'); }
      if (!done.items.rest && t >= T.rest) {
        done.items.rest = true;
        others.slice(1).forEach(function (el, i) { el.style.setProperty('--d', String(i * 2)); el.classList.add('is-in'); });
      }
      if (!done.q && t >= T.q) { done.q = true; hero.classList.add('is-q'); }
      if (!done.e && t >= T.e) { done.e = true; hero.classList.add('is-e'); if (l2) l2.classList.add('is-in'); }
      if (t >= T.end && !done.fin) { done.fin = true; showAll(); return; }
      requestAnimationFrame(frame);
    }

    // 最後の保険: 何かで止まっても数秒後に最終状態にする
    setTimeout(function () { if (!done.fin) { done.fin = true; showAll(); } }, (T.end + 2) * 1000);
    requestAnimationFrame(frame);
  } catch (err) {
    console.error('hero.js:', err);
    showAll();
  }
})();
