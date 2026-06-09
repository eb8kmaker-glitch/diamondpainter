/**
 * Diamond Painter — Post-export Community Toast (create.html)
 * ==========================================================
 * After a successful pattern export/download, gently slide in a small,
 * non-blocking toast inviting the user to share their finished work in
 * the Korean Naver Cafe community.
 *
 * Rules:
 *  - KO locale only (the cafe is a Korean-language community).
 *  - Once per session (sessionStorage flag).
 *  - Never blocks the tool: no modal/interstitial, doesn't steal focus,
 *    doesn't cover the download button / pattern / ad slots.
 *  - The tool calls window.showCafeToast() at its export-success points.
 *    It owns no tool logic — only this self-contained presentation.
 *
 * To enable other-language communities later (Discord, etc.), flip
 * `enabled` and add the matching STRINGS keys below — no other changes.
 */
(function () {
  'use strict';

  /* ─── Per-locale community config (mirrors community-banner.js) ── */
  var COMMUNITIES = {
    ko: { enabled: true,  url: 'https://cafe.naver.com/diamondart', platform: 'naver' },
    en: { enabled: false, url: '', platform: '' },
    ja: { enabled: false, url: '', platform: '' },
    zh: { enabled: false, url: '', platform: '' },
  };

  /* ─── Copy (component language pack). Only ko today. ──────────── */
  var STRINGS = {
    ko: {
      title: '도안 완성! 🎉 직접 완성하시면 다이아몬드아트클럽에서 자랑해 주세요.',
      cta: '카페에서 자랑하기 →',
      cta_aria: '네이버 카페 다이아몬드아트클럽에서 완성작 자랑하기 (새 탭에서 열림)',
      close_aria: '닫기',
    },
    // en/ja/zh: intentionally empty — toast is hidden for these locales.
  };

  var SESSION_FLAG = 'dp_cafe_toast_shown';
  var STYLE_ID = 'dp-cafe-toast-style';
  var AUTO_DISMISS_MS = 9000;

  function currentLang() {
    return localStorage.getItem('dp_lang') || 'ko';
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      '.dp-cafe-toast{position:fixed;right:20px;bottom:20px;z-index:1100;width:320px;max-width:calc(100vw - 32px);' +
        'background:rgba(13,22,56,0.97);border:1px solid rgba(200,166,255,0.28);border-radius:14px;' +
        'box-shadow:0 8px 32px rgba(0,0,0,0.45),0 0 0 1px rgba(111,231,255,0.06);' +
        'padding:16px 16px 16px 18px;color:#e6ebff;' +
        'backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);' +
        'opacity:0;transform:translateY(16px);transition:opacity .35s ease,transform .35s ease;}' +
      '.dp-cafe-toast.dp-cafe-show{opacity:1;transform:translateY(0);}' +
      '.dp-cafe-toast-close{position:absolute;top:8px;right:10px;background:none;border:none;color:#8f9bbd;' +
        'font-size:16px;line-height:1;cursor:pointer;padding:4px;border-radius:6px;}' +
      '.dp-cafe-toast-close:hover{color:#e6ebff;}' +
      '.dp-cafe-toast-close:focus-visible{outline:2px solid #6fe7ff;outline-offset:1px;}' +
      '.dp-cafe-toast-body{display:flex;gap:11px;align-items:flex-start;padding-right:14px;}' +
      '.dp-cafe-toast-mark{flex:0 0 auto;font-size:18px;line-height:1.3;color:#c8a6ff;}' +
      '.dp-cafe-toast-text{font-size:13.5px;line-height:1.5;color:#e6ebff;margin:0;}' +
      '.dp-cafe-toast-cta{display:inline-block;margin-top:12px;background:linear-gradient(135deg,#6fe7ff,#c8a6ff);' +
        'color:#080e22;font-size:13px;font-weight:700;text-decoration:none;padding:9px 16px;border-radius:100px;' +
        'transition:transform .15s,box-shadow .15s;}' +
      '.dp-cafe-toast-cta:hover{transform:translateY(-1px);box-shadow:0 4px 18px rgba(124,92,231,0.4);}' +
      '.dp-cafe-toast-cta:focus-visible{outline:3px solid #6fe7ff;outline-offset:2px;}' +
      '@media (max-width:560px){.dp-cafe-toast{right:12px;left:12px;bottom:78px;width:auto;}}' +
      '@media (prefers-reduced-motion:reduce){.dp-cafe-toast{transition:opacity .2s ease;transform:none;}' +
        '.dp-cafe-toast.dp-cafe-show{transform:none;}}';
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function buildUrl(base) {
    var sep = base.indexOf('?') === -1 ? '?' : '&';
    return base + sep +
      'utm_source=diamondpainter&utm_medium=toast&utm_campaign=cafe_join&utm_content=create_export';
  }

  window.showCafeToast = function () {
    var lang = currentLang();
    var cfg = COMMUNITIES[lang];
    if (!cfg || !cfg.enabled || !cfg.url) return;            // locale gate
    var s = STRINGS[lang];
    if (!s) return;
    try {
      if (sessionStorage.getItem(SESSION_FLAG)) return;       // once per session
      sessionStorage.setItem(SESSION_FLAG, '1');
    } catch (e) { /* sessionStorage unavailable — show once, no persistence */ }
    if (document.querySelector('.dp-cafe-toast')) return;     // already on screen

    injectStyles();

    var toast = document.createElement('div');
    toast.className = 'dp-cafe-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    var closeBtn = document.createElement('button');
    closeBtn.className = 'dp-cafe-toast-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', s.close_aria);
    closeBtn.textContent = '✕';

    var body = document.createElement('div');
    body.className = 'dp-cafe-toast-body';
    body.innerHTML =
      '<span class="dp-cafe-toast-mark" aria-hidden="true">◆</span>' +
      '<p class="dp-cafe-toast-text"></p>';
    body.querySelector('.dp-cafe-toast-text').textContent = s.title;

    var cta = document.createElement('a');
    cta.className = 'dp-cafe-toast-cta';
    cta.href = buildUrl(cfg.url);
    cta.target = '_blank';
    cta.rel = 'noopener noreferrer';
    cta.textContent = s.cta;
    cta.setAttribute('aria-label', s.cta_aria);

    toast.appendChild(closeBtn);
    toast.appendChild(body);
    toast.appendChild(cta);
    document.body.appendChild(toast);

    // slide in (next frame so transition applies)
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { toast.classList.add('dp-cafe-show'); });
    });

    var dismissTimer = null;
    function dismiss() {
      if (dismissTimer) { clearTimeout(dismissTimer); dismissTimer = null; }
      toast.classList.remove('dp-cafe-show');
      var removed = false;
      function done() { if (removed) return; removed = true; if (toast.parentNode) toast.parentNode.removeChild(toast); }
      toast.addEventListener('transitionend', done, { once: true });
      setTimeout(done, 500); // fallback if transitionend doesn't fire
    }

    closeBtn.addEventListener('click', dismiss);
    cta.addEventListener('click', dismiss);
    dismissTimer = setTimeout(dismiss, AUTO_DISMISS_MS);
  };
})();
