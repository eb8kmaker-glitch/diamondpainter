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
