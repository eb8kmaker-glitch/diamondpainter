/**
 * renderFinishedPreview.js
 *
 * Renders a realistic finished diamond painting preview from pattern JSON data.
 * Simulates the visual appearance of completed square resin drills on canvas:
 *   - Square drill geometry with 1px canvas gap
 *   - Bevel highlight / shadow (light from top-left ~11 o'clock)
 *   - Adaptive specular highlight (brighter on dark drills, subtle on light ones)
 *   - Resin saturation boost
 *   - Warm linen canvas backing visible through gaps
 *
 * Style goal: elegant and realistic — not glittery or over-processed.
 *
 * Reusable: include on any page as a plain <script> tag.
 *
 * API:
 *   renderFinishedPreview(source: string | Object) → Promise<string>
 *     source  — URL string pointing to a pattern .json file, OR a pre-parsed data object
 *     returns — JPEG data URL of the rendered preview image
 *
 * The result is automatically cached by URL so repeated calls are instant.
 *
 * Compatible with create.html pattern format:
 *   { version, pattern: { width, height, grid: [{palIdx}] }, palette: [{color:[r,g,b]}] }
 */
(function (global) {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────────
  // Configuration
  // ─────────────────────────────────────────────────────────────────────────

  /** Total cell size in output pixels (drill + gap). */
  const CELL  = 4;

  /** Drill area within each cell (top-left DRILL×DRILL pixels). */
  const DRILL = 3;

  /** Canvas backing colour — warm linen tone visible in the 1px gaps. */
  const GAP_R = 154, GAP_G = 146, GAP_B = 136;

  /**
   * Bevel parameters.
   * Light source: top-left (~11 o'clock), single directional.
   * Values are additive RGB offsets applied to the resin-adjusted base colour.
   */
  const B_TL     =  88;   // top-left corner   (top + left bevels combined)
  const B_TOP    =  68;   // top edge
  const B_TR     =  22;   // top-right corner  (top only, partially blocked)
  const B_LEFT   =  40;   // left edge
  const S_RIGHT  = -44;   // right edge shadow (mild — partially lit by ambient)
  const S_BL     =   8;   // bottom-left corner (slight residual left-bevel)
  const S_BOTTOM = -28;   // bottom center shadow
  const S_BR     = -78;   // bottom-right corner (deepest shadow)

  /**
   * Specular highlight blended into pixel (1,1) — the inner top-left face.
   * Uses a slightly cool white (255,255,255) → (248,251,255) to mimic neutral light.
   * Blend factor is adaptive: dark drills get a stronger visible sparkle.
   */
  const SPEC_BASE  = 0.38;  // base blend toward white
  const SPEC_BOOST = 0.18;  // extra boost for dark drills (lum < 85)
  const SPEC_R = 248, SPEC_G = 251, SPEC_B = 255;  // slightly cool specular white

  /**
   * Resin colour adjustment.
   * Real resin drills appear slightly more saturated than the source colour.
   * Factor > 1 pushes channels away from grey (boosts saturation).
   */
  const RESIN_SAT = 1.08;

  // ─────────────────────────────────────────────────────────────────────────
  // Internal helpers
  // ─────────────────────────────────────────────────────────────────────────

  const _cache = {};

  /** Clamp a value to [0, 255]. */
  function clamp(v) {
    return v < 0 ? 0 : v > 255 ? 255 : v | 0;
  }

  /** Write one pixel into an ImageData buffer. */
  function setpx(data, stride, x, y, r, g, b) {
    const i = (y * stride + x) << 2;
    data[i    ] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
    data[i + 3] = 255;
  }

  /**
   * Apply resin saturation boost.
   * Nudges the colour away from its perceptual grey midpoint,
   * making it appear richer and slightly more luminous — as resin does.
   */
  function resinAdjust(r, g, b) {
    const avg = (r + g + b) / 3;
    return [
      clamp(avg + (r - avg) * RESIN_SAT),
      clamp(avg + (g - avg) * RESIN_SAT),
      clamp(avg + (b - avg) * RESIN_SAT),
    ];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Core rendering
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Pure synchronous render — CPU-bound Canvas / ImageData work.
   * Accepts a pre-parsed pattern data object.
   * Returns a JPEG data URL string.
   */
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

    // ── 1. Fill entire buffer with canvas backing colour ──────────────────
    for (let i = 0, n = px.length; i < n; i += 4) {
      px[i    ] = GAP_R;
      px[i + 1] = GAP_G;
      px[i + 2] = GAP_B;
      px[i + 3] = 255;
    }

    // ── 2. Draw each drill ────────────────────────────────────────────────
    for (let ci = 0, n = grid.length; ci < n; ci++) {
      const palIdx = grid[ci].palIdx;
      if (palIdx < 0 || palIdx >= palette.length) continue;

      const [br, bg, bb] = palette[palIdx].color;
      const [r,  g,  b ] = resinAdjust(br, bg, bb);

      const ox = (ci % width)           * CELL;
      const oy = Math.floor(ci / width) * CELL;

      // Adaptive specular strength based on drill luminance:
      //   Dark drills (low lum) need a stronger highlight to appear "sparkly".
      //   Light drills are already bright — keep the spec subtle.
      const lum    = 0.299 * r + 0.587 * g + 0.114 * b;
      const sAlpha = lum < 85  ? SPEC_BASE + SPEC_BOOST :
                     lum > 205 ? SPEC_BASE * 0.38        : SPEC_BASE;

      // Specular pixel colour: blend base colour toward cool white.
      const sr = Math.round(r + (SPEC_R - r) * sAlpha);
      const sg = Math.round(g + (SPEC_G - g) * sAlpha);
      const sb = Math.round(b + (SPEC_B - b) * sAlpha);

      // ── 3×3 drill pixel layout (relative to ox, oy) ───────────────────
      //
      //   (0,0)TL  (1,0)T   (2,0)TR
      //   (0,1)L   (1,1)SP  (2,1)R
      //   (0,2)BL  (1,2)B   (2,2)BR
      //
      // TL = top-left corner   (brightest — both bevels)
      // T  = top edge          (bright)
      // TR = top-right corner  (slight top bevel, beginning of right shadow)
      // L  = left edge         (bright)
      // SP = specular point    (near-white highlight — the "sparkle")
      // R  = right face        (mild shadow)
      // BL = bottom-left       (very slight residual left-bevel)
      // B  = bottom center     (mild shadow)
      // BR = bottom-right      (deepest shadow — corner most in shade)

      setpx(px, cw, ox,     oy,     r + B_TL,        g + B_TL,        b + B_TL);
      setpx(px, cw, ox + 1, oy,     r + B_TOP,       g + B_TOP,       b + B_TOP);
      setpx(px, cw, ox + 2, oy,     r + B_TR,        g + B_TR,        b + B_TR);

      setpx(px, cw, ox,     oy + 1, r + B_LEFT,      g + B_LEFT,      b + B_LEFT);
      setpx(px, cw, ox + 1, oy + 1, sr,              sg,              sb);
      setpx(px, cw, ox + 2, oy + 1, r + S_RIGHT,     g + S_RIGHT,     b + S_RIGHT);

      setpx(px, cw, ox,     oy + 2, r + S_BL,        g + S_BL,        b + S_BL);
      setpx(px, cw, ox + 1, oy + 2, r + S_BOTTOM,    g + S_BOTTOM,    b + S_BOTTOM);
      setpx(px, cw, ox + 2, oy + 2, r + S_BR,        g + S_BR,        b + S_BR);
    }

    ctx.putImageData(img, 0, 0);

    // JPEG at 0.90 quality: good balance between sharpness and file size.
    // Higher quality preserves the fine bevel detail better than lower settings.
    return canvas.toDataURL('image/jpeg', 0.90);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Render a finished diamond painting preview.
   *
   * @param   {string|Object} source  URL to pattern JSON, or a pre-parsed data object.
   * @returns {Promise<string>}       Resolves to a JPEG data URL.
   *
   * Results are cached by URL (subsequent calls for the same URL return immediately).
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
