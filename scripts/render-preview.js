/**
 * render-preview.js
 * Node.js script to pre-render a finished diamond painting preview from pattern JSON.
 * Uses the same pipeline as js/renderFinishedPreview.js (browser version).
 *
 * Usage:
 *   node scripts/render-preview.js <pattern.json> <output.jpg>
 */

const fs   = require('fs');
const { createCanvas } = require('./node_modules/canvas');

// ── Config (mirror of renderFinishedPreview.js) ────────────────────────────
const CELL = 4;
const BEVEL = [
  [  0.26,   0.20,   0.18,   0.08 ],
  [  0.20,   0.00,   0.00,  -0.12 ],
  [  0.18,   0.00,   0.00,  -0.14 ],
  [  0.04,  -0.18,  -0.20,  -0.24 ],
];
const SPARKLE_RATE       = 0.055;
const SPARKLE_WHITE      = 0.80;
const SPARKLE_DARK_BOOST = 0.12;
const SPARKLE_BRIGHT_MUL = 0.60;
const VIBRANCE   = 0.18;
const SAT_FACTOR = 1.08;
const BRIGHTNESS = 1.12;
const CONTRAST   = 0.15;
const BP_GAMMA   = 1.06;
const JPEG_QUALITY = 0.94;

function clamp(v) { return v < 0 ? 0 : v > 255 ? 255 : v | 0; }

function blend(c, w) {
  return w >= 0 ? c + (255 - c) * w : c + c * w;
}

function hashDrill(i) {
  let h = Math.imul(i ^ 0xdeadbeef, 0x9e3779b9);
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
}

function enhanceColor(r, g, b) {
  let fr = r / 255, fg = g / 255, fb = b / 255;
  const mx = Math.max(fr, fg, fb);
  const mn = Math.min(fr, fg, fb);
  const sat = mx === 0 ? 0 : (mx - mn) / mx;
  const vf  = (1 - sat) * VIBRANCE;
  const avg = (fr + fg + fb) / 3;
  fr = fr + (fr - avg) * vf;
  fg = fg + (fg - avg) * vf;
  fb = fb + (fb - avg) * vf;
  const avg2 = (fr + fg + fb) / 3;
  fr = avg2 + (fr - avg2) * SAT_FACTOR;
  fg = avg2 + (fg - avg2) * SAT_FACTOR;
  fb = avg2 + (fb - avg2) * SAT_FACTOR;
  fr = Math.min(fr * BRIGHTNESS, 1);
  fg = Math.min(fg * BRIGHTNESS, 1);
  fb = Math.min(fb * BRIGHTNESS, 1);
  function sCurve(v) {
    const t = (v - 0.5) * (1 + CONTRAST * 2);
    return t < -0.5 ? 0 : t > 0.5 ? 1 : t + 0.5;
  }
  fr = sCurve(fr); fg = sCurve(fg); fb = sCurve(fb);
  fr = Math.pow(Math.max(fr, 0), 1 / BP_GAMMA);
  fg = Math.pow(Math.max(fg, 0), 1 / BP_GAMMA);
  fb = Math.pow(Math.max(fb, 0), 1 / BP_GAMMA);
  return [Math.round(fr * 255), Math.round(fg * 255), Math.round(fb * 255)];
}

function render(patternData) {
  const { pattern, palette } = patternData;
  const { width, height, grid } = pattern;

  const cw = width  * CELL;
  const ch = height * CELL;

  const canvas = createCanvas(cw, ch);
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(cw, ch);
  const px = imgData.data;

  const enhanced = palette.map(e => enhanceColor(e.color[0], e.color[1], e.color[2]));

  const total = grid.length;
  let lastPct = -1;
  for (let ci = 0; ci < total; ci++) {
    const pct = Math.floor(ci / total * 100);
    if (pct !== lastPct && pct % 10 === 0) { process.stdout.write(`\r  ${pct}%`); lastPct = pct; }

    const palIdx = grid[ci].palIdx;
    if (palIdx < 0 || palIdx >= palette.length) continue;

    const [r, g, b] = enhanced[palIdx];
    const ox = (ci % width)           * CELL;
    const oy = Math.floor(ci / width) * CELL;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const spark = hashDrill(ci) < SPARKLE_RATE;
    const sWhite = lum < 80  ? SPARKLE_WHITE + SPARKLE_DARK_BOOST :
                   lum > 210 ? SPARKLE_WHITE * SPARKLE_BRIGHT_MUL : SPARKLE_WHITE;

    for (let dy = 0; dy < CELL; dy++) {
      const bRow = BEVEL[dy];
      for (let dx = 0; dx < CELL; dx++) {
        const w = (spark && dx === 1 && dy === 1) ? sWhite : bRow[dx];
        const i = ((oy + dy) * cw + (ox + dx)) * 4;
        px[i    ] = clamp(blend(r, w));
        px[i + 1] = clamp(blend(g, w));
        px[i + 2] = clamp(blend(b, w));
        px[i + 3] = 255;
      }
    }
  }
  process.stdout.write('\r  100%\n');
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

// ── Main ───────────────────────────────────────────────────────────────────
const [,, jsonPath, outPath] = process.argv;
if (!jsonPath || !outPath) {
  console.error('Usage: node scripts/render-preview.js <pattern.json> <output.jpg>');
  process.exit(1);
}

console.log(`Reading ${jsonPath}...`);
const patternData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
const { width, height } = patternData.pattern;
console.log(`Pattern: ${width}x${height} drills, ${patternData.palette.length} colors`);
console.log(`Canvas: ${width * CELL}x${height * CELL}px`);
console.log('Rendering...');

const canvas = render(patternData);
const outStream = fs.createWriteStream(outPath);
const stream = canvas.createJPEGStream({ quality: JPEG_QUALITY });
stream.pipe(outStream);
outStream.on('finish', () => {
  const stat = fs.statSync(outPath);
  console.log(`Saved: ${outPath} (${(stat.size / 1024).toFixed(0)} KB)`);
});
