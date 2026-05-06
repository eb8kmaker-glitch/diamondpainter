/**
 * Diamond Painter — AdSense Ad Slot Manager
 * ==========================================
 * Publisher ID: ca-pub-8254204207118050
 *
 * CURRENT STATE:
 *   All ad slots render safe placeholder containers only.
 *   No live ads are injected until slot IDs are configured below.
 *
 * HOW TO ACTIVATE REAL ADS (step by step):
 * ─────────────────────────────────────────
 * 1. Log in to Google AdSense (adsense.google.com)
 * 2. Go to Ads → By ad unit → Create new ad unit
 * 3. Choose ad type (Display, In-article, etc.)
 * 4. Copy the numeric slot ID from the generated <ins> code
 *    Example: data-ad-slot="1234567890"
 * 5. In the SLOTS object below, set the slotId for each position
 * 6. Call DiamondPainterAds.activate() or reload the page
 *
 * RECOMMENDED AD UNIT TYPES:
 * ─────────────────────────────────────────
 *   ArticleTopAd    → Display / Leaderboard (728×90 or responsive)
 *   ArticleMiddleAd → In-article (responsive)
 *   SidebarAd       → Display / Rectangle (300×250)
 *   FooterAd        → Display / Leaderboard (responsive)
 *
 * UX GUIDELINES (to protect AdSense standing):
 * ─────────────────────────────────────────────
 *   - Do not place more than 3 ad units per page
 *   - Never place ads inside the create.html tool canvas area
 *   - Keep at least 200px of content between consecutive ads
 *   - Never use fixed-position ads that obscure content
 *   - Always set aria-label="Advertisement" on ad containers
 */

(function () {
  'use strict';

  var AD_CLIENT = 'ca-pub-8254204207118050';

  /**
   * Configure slot IDs here once you have them from AdSense.
   * Leave slotId as null to keep the placeholder — no live ad will load.
   *
   * name         : human-readable label for debugging
   * selector     : CSS selector that matches the ad slot container
   * slotId       : numeric AdSense slot ID string, or null to stay as placeholder
   * format       : 'auto' | 'rectangle' | 'leaderboard' | 'in-article'
   * fullWidth    : true for responsive full-width banners
   */
  var SLOTS = [
    {
      name:      'ArticleTopAd',
      selector:  '.ad-slot--article-top',
      slotId:    null,           // ← replace with your slot ID, e.g. '1234567890'
      format:    'auto',
      fullWidth: true,
    },
    {
      name:      'ArticleMiddleAd',
      selector:  '.ad-slot--article-middle',
      slotId:    null,
      format:    'fluid',
      layout:    'in-article',
      fullWidth: false,
    },
    {
      name:      'SidebarAd',
      selector:  '.ad-slot--sidebar',
      slotId:    null,
      format:    'auto',
      fullWidth: false,
    },
    {
      name:      'FooterAd',
      selector:  '.ad-slot--footer',
      slotId:    null,
      format:    'auto',
      fullWidth: true,
    },
  ];

  /**
   * Injects a live <ins class="adsbygoogle"> unit into a container.
   * Only called when slotId is configured.
   */
  function injectAdUnit(container, slot) {
    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', AD_CLIENT);
    ins.setAttribute('data-ad-slot',   slot.slotId);
    ins.setAttribute('data-ad-format', slot.format);

    if (slot.layout) {
      ins.setAttribute('data-ad-layout', slot.layout);
    }
    if (slot.fullWidth) {
      ins.setAttribute('data-full-width-responsive', 'true');
    }

    // Clear placeholder content and insert ad unit
    container.innerHTML = '';
    container.appendChild(ins);

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn('[DiamondPainterAds] Failed to push ad:', slot.name, e);
    }
  }

  /**
   * Activates all configured ad slots on the current page.
   * Slots with slotId = null are left as visual placeholders.
   * Safe to call multiple times — will not double-inject.
   */
  function activate() {
    SLOTS.forEach(function (slot) {
      if (!slot.slotId) return; // placeholder mode — skip

      var containers = document.querySelectorAll(slot.selector);
      containers.forEach(function (container) {
        if (container.dataset.adActivated) return; // already injected
        container.dataset.adActivated = 'true';
        injectAdUnit(container, slot);
      });
    });
  }

  /**
   * Returns the current slot configuration.
   * Useful for debugging which slots are active on a page.
   */
  function status() {
    var result = SLOTS.map(function (s) {
      var els = document.querySelectorAll(s.selector).length;
      return {
        name:     s.name,
        selector: s.selector,
        active:   !!s.slotId,
        slotId:   s.slotId || '(placeholder)',
        onPage:   els,
      };
    });
    console.table(result);
    return result;
  }

  // Public API
  window.DiamondPainterAds = {
    client:   AD_CLIENT,
    slots:    SLOTS,
    activate: activate,
    status:   status,
  };

  // Auto-activate on DOMContentLoaded
  // (has no effect until slotIds are configured)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', activate);
  } else {
    activate();
  }

}());
