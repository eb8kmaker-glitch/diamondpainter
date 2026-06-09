/**
 * Diamond Painter — Community Banner
 * ==================================
 * Locale-targeted invite to the Korean Naver Cafe community.
 *
 * The Naver Cafe is a Korean-language community, so this banner is shown
 * ONLY for the `ko` locale. Other locales render nothing (the banner is
 * removed from the DOM) until a community for that language exists.
 *
 * To add another community later (e.g. a Discord for EN), flip `enabled`
 * and fill in `url` / `platform` below — no markup changes needed.
 *
 * Single source of truth: this file owns the config, markup, styles and
 * the `ko` copy keys. Include it (after i18n.js) on content pages only.
 * Do NOT include it on create.html or on legal/contact pages.
 */
(function () {
  'use strict';

  /* ─── Per-locale community config ─────────────────────────────── */
  var COMMUNITIES = {
    ko: { enabled: true,  url: 'https://cafe.naver.com/diamondart', platform: 'naver' },
    en: { enabled: false, url: '', platform: '' },
    ja: { enabled: false, url: '', platform: '' },
    zh: { enabled: false, url: '', platform: '' },
  };

  if (!window.dpI18n || !window.dpI18n.extend) return;

  /* ─── Copy (i18n) ─────────────────────────────────────────────
     Only `ko` is needed today. Other locales are intentionally left
     without keys — the banner is hidden there regardless. Add keys
     here when their community is enabled above. */
  window.dpI18n.extend({
    ko: {
      cb_title: '다이아몬드아트클럽 카페에서 함께해요',
      cb_point1: '사놓고 방치한 도안, 함께 완성할 페이스메이커',
      cb_point2: '나만 보기 아까운 완성작 마음껏 자랑',
      cb_point3: '잔접착제 처리·큐빅 정돈 등 고수들의 꿀팁',
      cb_cta: '네이버 카페 가입하기 →',
      cb_aria: '네이버 카페 다이아몬드아트클럽 가입하기 (새 탭에서 열림)',
    },
  });

  /* ─── Styles (scoped, injected once) ──────────────────────────── */
  var STYLE_ID = 'dp-community-style';
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      '.dp-community{margin:48px auto;max-width:var(--max-w-text,740px);padding:0 20px;}' +
      '.dp-community-inner{position:relative;display:flex;flex-wrap:wrap;align-items:center;gap:20px 28px;' +
        'background:linear-gradient(135deg,var(--card,#fff),var(--lavender-light,#ede9fe));' +
        'border:1px solid var(--border,#d8dff0);border-radius:var(--radius,12px);' +
        'box-shadow:var(--shadow-card,0 10px 28px rgba(8,14,34,0.07));padding:24px 28px;}' +
      '.dp-community-mark{flex:0 0 auto;font-size:30px;line-height:1;color:var(--accent2,#7c5ce7);}' +
      '.dp-community-body{flex:1 1 280px;min-width:0;}' +
      '.dp-community-title{font-family:"Playfair Display",Georgia,serif;font-size:20px;font-weight:600;' +
        'color:var(--primary,#080e22);margin:0 0 12px;line-height:1.3;}' +
      '.dp-community-points{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;}' +
      '.dp-community-points li{position:relative;padding-left:22px;font-size:14.5px;line-height:1.55;color:var(--text2,#1e2d5a);}' +
      '.dp-community-points li::before{content:"◆";position:absolute;left:0;top:1px;font-size:11px;color:var(--accent,#0eb4d4);}' +
      '.dp-community-cta{flex:0 0 auto;align-self:center;display:inline-block;white-space:nowrap;' +
        'background:linear-gradient(135deg,var(--accent,#0eb4d4),var(--accent2,#7c5ce7));color:#fff;' +
        'font-size:15px;font-weight:600;text-decoration:none;padding:12px 22px;border-radius:100px;' +
        'box-shadow:var(--glow-accent,0 4px 24px rgba(14,180,212,0.35));transition:transform .15s,box-shadow .15s;}' +
      '.dp-community-cta:hover{transform:translateY(-1px);box-shadow:0 6px 28px rgba(124,92,231,0.4);}' +
      '.dp-community-cta:focus-visible{outline:3px solid var(--accent,#0eb4d4);outline-offset:2px;}' +
      '@media (max-width:560px){.dp-community-inner{padding:22px 20px;}.dp-community-cta{width:100%;text-align:center;}}';
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ─── utm_content from page location ──────────────────────────── */
  function deriveContent() {
    var p = location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
    if (p === '' || /\/index$/.test(p)) return /\/guide$/.test(p) ? 'guide' : 'home';
    if (/\/guide(\/|$)/.test(p)) return 'guide';
    if (/gallery$/.test(p)) return 'gallery';
    if (/faq$/.test(p)) return 'faq';
    if (/about$/.test(p)) return 'about';
    var seg = p.split('/').pop();
    return seg || 'home';
  }

  function buildUrl(base) {
    var sep = base.indexOf('?') === -1 ? '?' : '&';
    return base + sep +
      'utm_source=diamondpainter&utm_medium=banner&utm_campaign=cafe_join' +
      '&utm_content=' + encodeURIComponent(deriveContent());
  }

  /* ─── Build banner DOM (text filled by i18n via data-i18n) ────── */
  function buildBanner() {
    var section = document.createElement('section');
    section.className = 'dp-community';
    section.setAttribute('aria-labelledby', 'dp-community-title');
    section.innerHTML =
      '<div class="dp-community-inner">' +
        '<div class="dp-community-mark" aria-hidden="true">◆</div>' +
        '<div class="dp-community-body">' +
          '<h2 id="dp-community-title" class="dp-community-title" data-i18n="cb_title"></h2>' +
          '<ul class="dp-community-points">' +
            '<li data-i18n="cb_point1"></li>' +
            '<li data-i18n="cb_point2"></li>' +
            '<li data-i18n="cb_point3"></li>' +
          '</ul>' +
        '</div>' +
        '<a class="dp-community-cta" target="_blank" rel="noopener noreferrer" data-i18n="cb_cta"></a>' +
      '</div>';
    return section;
  }

  var bannerEl = null;

  function render() {
    var lang = window.dpI18n.getCurrentLang();
    var cfg = COMMUNITIES[lang];
    var show = !!(cfg && cfg.enabled && cfg.url);

    if (!show) {
      if (bannerEl && bannerEl.parentNode) bannerEl.parentNode.removeChild(bannerEl);
      bannerEl = null;
      return;
    }

    if (!bannerEl) {
      injectStyles();
      bannerEl = buildBanner();
      var footer = document.querySelector('footer.site-footer, footer');
      if (footer && footer.parentNode) {
        footer.parentNode.insertBefore(bannerEl, footer);
      } else {
        document.body.appendChild(bannerEl);
      }
    }

    // Link target + UTM + accessible label
    var link = bannerEl.querySelector('.dp-community-cta');
    link.setAttribute('href', buildUrl(cfg.url));
    var aria = window.dpI18n.t('cb_aria');
    if (aria) link.setAttribute('aria-label', aria);

    // Fill localized text
    window.dpI18n.applyTranslations();
  }

  function init() {
    render();
    // React to in-page language switches (same mechanism i18n uses).
    document.querySelectorAll('.dp-lang-select').forEach(function (sel) {
      sel.addEventListener('change', function () {
        // i18n's own listener updates currentLang first; re-evaluate after.
        setTimeout(render, 0);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
