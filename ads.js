/**
 * Diamond Painter — AdSense Slot Manager
 * =======================================
 * Publisher : ca-pub-8254204287118850
 * Script    : loaded once via <head> (adsbygoogle.js)
 * This file : injected with `defer` — runs after DOM is ready
 *
 * Slot registry. To deactivate a slot temporarily, set slotId: null.
 * ads.js will fall back to the placeholder shell (no ad request made).
 *
 * DiamondPainterAds.status() — print slot states to console
 */
(function () {
  'use strict';

  var AD_CLIENT = 'ca-pub-8254204287118850';

  /* ─── Slot Registry ─────────────────────────────────────────── */
  var SLOTS = [
    /* ── index.html ───────────────────────────────────────────── */
    {
      name:      'diamond-painter-howto-gallery',
      selector:  '#ad-HowtoGalleryAd',
      slotId:    '2420763325',
      layout:    'in-article',
      format:    'fluid',
    },
    {
      name:      'diamond-painter-faq-mid',
      selector:  '#ad-FaqMidAd',
      slotId:    '3268986732',
      layout:    'in-article',
      format:    'fluid',
    },
    /* ── create.html ───────────────────────────────────────────── */
    {
      name:      'diamond-painter-right',
      selector:  '#ad-ResultSidebarAd',
      slotId:    '9943734977',
      format:    'auto',
      fullWidth: true,
    },
    {
      name:      'diamond-painter-download',
      selector:  '#ad-DownloadBottomAd',
      slotId:    '9109999600',
      format:    'auto',
      fullWidth: true,
    },
    {
      name:      'diamond-painter-footer',
      selector:  '#ad-FooterGuideAd',
      slotId:    '7744947044',
      format:    'auto',
      fullWidth: true,
    },
  ];

  /* ─── Inject a live <ins> into the container div ─────────────── */
  function injectAdUnit(container, slot) {
    if (container.dataset.adActivated) return; // guard: prevent double-inject
    container.dataset.adActivated = 'true';

    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.cssText = 'display:block;width:100%;';
    ins.setAttribute('data-ad-client', AD_CLIENT);
    ins.setAttribute('data-ad-slot',   slot.slotId);
    ins.setAttribute('data-ad-format', slot.format);
    if (slot.layout)    ins.setAttribute('data-ad-layout',            slot.layout);
    if (slot.fullWidth) ins.setAttribute('data-full-width-responsive', 'true');

    // Clear placeholder shell, insert real unit
    container.innerHTML = '';
    container.appendChild(ins);

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn('[DiamondPainterAds] push failed:', slot.name, e);
    }

    /* Unfilled fallback:
       Google sets data-ad-status="filled"|"unfilled" after ~2-3 s.
       If still not filled after 4 s, restore the placeholder shell so
       the reserved space keeps its visual cue (border + label via CSS). */
    setTimeout(function () {
      var status = ins.getAttribute('data-ad-status');
      if (status !== 'filled') {
        container.removeAttribute('data-ad-activated');
        container.innerHTML = '';                // clear collapsed ins
        container.classList.add('ad-unfilled'); // CSS ::before / ::after kick in
      }
    }, 4000);
  }

  /* ─── Activate all configured slots ──────────────────────────── */
  function activate() {
    SLOTS.forEach(function (slot) {
      if (!slot.slotId) return; // null → placeholder only, no ad request

      var container = document.querySelector(slot.selector);
      if (container) injectAdUnit(container, slot);
    });
  }

  /* ─── Debug helper ───────────────────────────────────────────── */
  function status() {
    var rows = SLOTS.map(function (s) {
      var el  = document.querySelector(s.selector);
      var ins = el ? el.querySelector('ins.adsbygoogle') : null;
      return {
        name:      s.name,
        selector:  s.selector,
        slotId:    s.slotId || '(placeholder)',
        active:    !!s.slotId,
        onPage:    !!el,
        injected:  !!ins,
        adStatus:  ins ? (ins.getAttribute('data-ad-status') || 'pending') : '—',
      };
    });
    console.table(rows);
    return rows;
  }

  /* ─── Public API ─────────────────────────────────────────────── */
  window.DiamondPainterAds = {
    client:   AD_CLIENT,
    slots:    SLOTS,
    activate: activate,
    status:   status,
  };

  /* ─── Auto-activate on DOM ready ─────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', activate);
  } else {
    activate(); // already parsed (defer fires after HTML parse)
  }

}());
