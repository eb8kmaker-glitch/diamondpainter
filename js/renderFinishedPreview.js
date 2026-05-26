/**
 * renderFinishedPreview.js
 *
 * Renders a realistic finished diamond painting preview from pattern JSON data.
 * Goal: looks like a real photo of completed square resin drills — not a filtered image.
 *
 * Pipeline per drill:
 *   1. Color enhancement (vibrance → saturation → brightness → S-curve → black-point gamma)
 *   2. 4×4 bevel (white/black blend per pixel, light source top-left ~35°)
 *   3. Selective sparkle (~5.5% of drills get a strong specular point at (1,1))
 *
 * No gap between drills — drill separation is achieved by bevel contrast alone.
 * No blur, no global overlay, no gray haze.
 *
 * API:
 *   renderFinishedPreview(source: string | Object) → Promise<string>
 *     source  — URL to a pattern .json file, or a pre-parsed data object
 *     returns — JPEG data URL (cached by URL for instant repeat calls)
 *
 * Pattern format (create.html):
 *   { version, pattern: { width, height, grid: [{palIdx}] }, palette: [{color:[r,g,b]}] }
 */
(function (global) {
  'use strict';

  // ── Configuration ──────────────────────────────────────────────────────────

  /** Pixels per drill (no gap — entire cell is drill face). */
  const CELL = 4;

  /**
   * 4×4 bevel weight table.
   * Positive → blend toward white (highlight).
   * Negative → blend toward black (shadow).
   * Light source: top-left, ~35°.
   *
   *  (0,0)TL  (1,0)T   (2,0)T   (3,0)TR
   *  (0,1)L   (1,1)C   (2,1)C   (3,1)R
   *  (0,2)L   (1,2)C   (2,2)C   (3,2)R
   *  (0,3)BL  (1,3)B   (2,3)B   (3,3)BR
   */
  const BEVEL = [
  //   col0    col1    col2    col3
    [  0.26,   0.20,   0.18,   0.08 ],  // row 0 — top face
    [  0.20,   0.00,   0.00,  -0.12 ],  // row 1
    [  0.18,   0.00,   0.00,  -0.14 ],  // row 2
    [  0.04,  -0.18,  -0.20,  -0.24 ],  // row 3 — bottom face
  ];

  /** Fraction of drills that receive a sparkle highlight (~5.5%). */
  const SPARKLE_RATE       = 0.055;
  /** Base white-blend for the sparkle pixel (1,1). */
  const SPARKLE_WHITE      = 0.80;
  /** Extra boost for dark drills (lum < 80) — they need more sparkle to read. */
  const SPARKLE_DARK_BOOST = 0.12;
  /** Reduced sparkle for very bright drills (lum > 210) — already near-white. */
  const SPARKLE_BRIGHT_MUL = 0.60;

  // Color enhancement pipeline
  const VIBRANCE   = 0.18;  // vibrance boost (targets less-saturated channels)
  const SAT_FACTOR = 1.08;  // flat saturation multiplier
  const BRIGHTNESS = 1.12;  // brightness multiplier
  const CONTRAST   = 0.15;  // S-curve contrast strength (0 = off, 0.5 = strong)
  const BP_GAMMA   = 1.06;  // black-point gamma (slightly lifts shadows)

  // JPEG output quality — higher preserves fine bevel edges.
  const JPEG_QUALITY = 0.94;

  // ── Internal state ─────────────────────────────────────────────────────────

  const _cache = {};

  // ── Helpers ────────────────────────────────────────────────────────────────

  function clamp(v) { return v < 0 ? 0 : v > 255 ? 255 : v | 0; }

  function setpx(data, stride, x, y, r, g, b) {
    const i = (y * stride + x) << 2;
    data[i    ] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
    data[i + 3] = 255;
  }

  /**
   * Blend a channel value toward white (w > 0) or black (w < 0).
   *   w = +1.0 → 255 (pure white)
   *   w = -1.0 → 0   (pure black)
   */
  function blend(c, w) {
    return w >= 0 ? c + (255 - c) * w : c + c * w;
  }

  /**
   * Deterministic per-drill hash [0, 1).
   * Same drill index always produces the same value — sparkle placement is stable.
   */
  function hashDrill(i) {
    let h = Math.imul(i ^ 0xdeadbeef, 0x9e3779b9);
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
  }

  // ── Color Enhancement Pipeline ─────────────────────────────────────────────

  /**
   * Apply full resin color enhancement to one RGB triplet.
   * Operates in [0, 1] float space, returns rounded [0, 255] integers.
   */
  function enhanceColor(r, g, b) {
    let fr = r / 255, fg = g / 255, fb = b / 255;

    // 1. Vibrance — boost the least-saturated channel more.
    //    Prevents already-vivid colours from over-saturating while lifting dull ones.
    const mx = Math.max(fr, fg, fb);
    const mn = Math.min(fr, fg, fb);
    const sat = mx === 0 ? 0 : (mx - mn) / mx;
    const vf  = (1 - sat) * VIBRANCE;
    const avg = (fr + fg + fb) / 3;
    fr = fr + (fr - avg) * vf;
    fg = fg + (fg - avg) * vf;
    fb = fb + (fb - avg) * vf;

    // 2. Saturation — flat boost (simulates resin's saturating effect).
    const avg2 = (fr + fg + fb) / 3;
    fr = avg2 + (fr - avg2) * SAT_FACTOR;
    fg = avg2 + (fg - avg2) * SAT_FACTOR;
    fb = avg2 + (fb - avg2) * SAT_FACTOR;

    // 3. Brightness
    fr = Math.min(fr * BRIGHTNESS, 1);
    fg = Math.min(fg * BRIGHTNESS, 1);
    fb = Math.min(fb * BRIGHTNESS, 1);

    // 4. S-curve contrast — pulls midtones apart for depth.
    function sCurve(v) {
      const t = (v - 0.5) * (1 + CONTRAST * 2);
      return t < -0.5 ? 0 : t > 0.5 ? 1 : t + 0.5;
    }
    fr = sCurve(fr);
    fg = sCurve(fg);
    fb = sCurve(fb);

    // 5. Black-point gamma — gently lifts near-black values so dark drills
    //    read as dark-but-rich rather than flat black.
    fr = Math.pow(Math.max(fr, 0), 1 / BP_GAMMA);
    fg = Math.pow(Math.max(fg, 0), 1 / BP_GAMMA);
    fb = Math.pow(Math.max(fb, 0), 1 / BP_GAMMA);

    return [Math.round(fr * 255), Math.round(fg * 255), Math.round(fb * 255)];
  }

  // ── Core Rendering ─────────────────────────────────────────────────────────

  function _render(patternData) {
    const { pattern, palette } = patternData;
    const { width, height, grid } = pattern;

    const cw = width  * CELL;
    const ch = height * CELL;

    const canvas = document.createElement('canvas');
    canvas.width  = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(cw, ch);
    const px  = img.data;

    // Pre-enhance all palette entries once (avoids redundant work per drill).
    const enhanced = palette.map(entry => enhanceColor(entry.color[0], entry.color[1], entry.color[2]));

    for (let ci = 0, n = grid.length; ci < n; ci++) {
      const palIdx = grid[ci].palIdx;
      if (palIdx < 0 || palIdx >= palette.length) continue;

      const [r, g, b] = enhanced[palIdx];
      const ox = (ci % width)            * CELL;
      const oy = Math.floor(ci / width)  * CELL;

      // Luminance for sparkle adaptation.
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Sparkle: deterministic per-drill hash decides if this drill sparkles.
      const spark  = hashDrill(ci) < SPARKLE_RATE;
      const sWhite = lum < 80  ? SPARKLE_WHITE + SPARKLE_DARK_BOOST :
                     lum > 210 ? SPARKLE_WHITE * SPARKLE_BRIGHT_MUL : SPARKLE_WHITE;

      for (let dy = 0; dy < CELL; dy++) {
        const bRow = BEVEL[dy];
        for (let dx = 0; dx < CELL; dx++) {
          // Sparkle overrides pixel (1,1) on selected drills.
          const w = (spark && dx === 1 && dy === 1) ? sWhite : bRow[dx];

          setpx(px, cw, ox + dx, oy + dy, blend(r, w), blend(g, w), blend(b, w));
        }
      }
    }

    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Render a finished diamond painting preview.
   *
   * @param   {string|Object} source  URL to pattern JSON, or a pre-parsed data object.
   * @returns {Promise<string>}       Resolves to a JPEG data URL.
   *
   * Results are cached by URL — repeated calls for the same URL are instant.
   */
  async function renderFinishedPreview(source) {
    const key = typeof source === 'string' ? source : null;
    if (key && _cache[key]) return _cache[key];

    let data;
    if (typeof source === 'string') {
      const res = await fetch(source);
      if (!res.ok) throw new Error(`Failed to fetch pattern: ${res.status}`);
      data = await res.json();
    } else {
      data = source;
    }

    const dataUrl = _render(data);
    if (key) _cache[key] = dataUrl;
    return dataUrl;
  }

  global.renderFinishedPreview = renderFinishedPreview;

}(window));
