/* ============================================================
   Diamond Painter — Shared utilities
   Small, dependency-free helpers loaded on every page.
   Reused across the responsive / mobile behaviors of later phases.
   ============================================================ */

/**
 * Returns true on coarse-pointer (touch) devices.
 * Prefer this over sniffing the user agent.
 * @returns {boolean}
 */
function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches;
}

// Expose globally so deferred/module scripts and inline handlers can reuse it.
window.isTouchDevice = isTouchDevice;

/**
 * Wrap content tables in a .table-wrap so wide tables scroll horizontally
 * on small screens instead of cramping or pushing the layout. Idempotent.
 * (create.html has no <table>, so this is a no-op there.)
 */
function wrapTablesForMobile() {
  document.querySelectorAll('table').forEach(function (table) {
    var parent = table.parentElement;
    if (!parent || parent.classList.contains('table-wrap')) return;
    var wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    parent.insertBefore(wrap, table);
    wrap.appendChild(table);
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wrapTablesForMobile);
} else {
  wrapTablesForMobile();
}
