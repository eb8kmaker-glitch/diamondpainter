/**
 * Diamond Painter — Pattern Description Generator
 * Generates SEO-friendly, human-readable, low-duplication descriptions
 * for diamond painting patterns based on generation parameters.
 *
 * Usage:
 *   const desc = generatePatternDescription({ colorCount, width, height, drillType });
 *   // desc.difficulty, desc.time, desc.size, desc.tip, desc.canvasRec, desc.style, desc.summary
 */

'use strict';

// ── Deterministic hash (for consistent variation per unique pattern) ──────────
function hashParams(colorCount, width, height) {
  const str = `${colorCount}-${width}-${height}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

function pick(arr, hash, offset = 0) {
  return arr[(hash + offset) % arr.length];
}

// ── Difficulty classification ─────────────────────────────────────────────────
function getDifficulty(colorCount, totalCells) {
  if (colorCount <= 15 && totalCells <= 15000) return 'beginner';
  if (colorCount <= 25 && totalCells <= 32000) return 'easy';
  if (colorCount <= 40 && totalCells <= 56000) return 'intermediate';
  if (colorCount <= 55) return 'advanced';
  return 'expert';
}

// ── Time estimate ─────────────────────────────────────────────────────────────
// Assumes 800–1200 drills/hr for round, 600–900 for square
function getTimeEstimate(totalCells, drillType) {
  const rate = drillType === 'square' ? 750 : 1000; // drills per hour (mid-range)
  const hours = totalCells / rate;
  if (hours < 5) return 'a few hours';
  if (hours < 15) return `${Math.round(hours / 2) * 2}–${Math.round(hours / 2) * 2 + 4} hours`;
  if (hours < 40) return `${Math.round(hours / 5) * 5}–${Math.round(hours / 5) * 5 + 10} hours`;
  if (hours < 100) return `${Math.round(hours / 10) * 10}–${Math.round(hours / 10) * 10 + 20} hours`;
  return `${Math.round(hours / 20) * 20}+ hours`;
}

// ── Size description ──────────────────────────────────────────────────────────
function getSizeDescription(width, height) {
  const maxDim = Math.max(width, height);
  if (maxDim <= 25) return 'small';
  if (maxDim <= 40) return 'medium';
  if (maxDim <= 60) return 'large';
  return 'extra-large';
}

// ── Canvas recommendation ─────────────────────────────────────────────────────
function getCanvasRecommendation(width, height, drillType) {
  const drillSize = drillType === 'square' ? 2.5 : 2.8;
  const physW = ((width * drillSize) / 10).toFixed(0);
  const physH = ((height * drillSize) / 10).toFixed(0);
  return `${physW}×${physH} cm`;
}

// ── Template pools — varied per difficulty ────────────────────────────────────
const difficultyTemplates = {
  beginner: [
    "With {n} DMC colors, this is a great first project — manageable complexity and plenty of solid areas to build momentum.",
    "At {n} colors, this pattern is an ideal starting point. Limited color switches keep the workflow simple and satisfying.",
    "This {n}-color design sits comfortably in beginner territory — clear sections, straightforward color matching, and a forgiving composition.",
  ],
  easy: [
    "A {n}-color palette gives this pattern clear definition without overwhelming complexity. A solid choice for a second or third project.",
    "With {n} DMC shades, this design balances detail and manageability well — approachable for newer crafters, rewarding for anyone.",
    "At {n} colors, there is enough variety to create visual depth without the organizational burden of a complex palette.",
  ],
  intermediate: [
    "This {n}-color pattern offers a meaningful challenge — enough shades to create subtle gradients and realistic detail.",
    "With {n} DMC colors in play, expect rich tonal transitions. Organization is key: sort drill bags before you start.",
    "At {n} colors, this is a rewarding intermediate project. The color complexity produces a more photorealistic result.",
  ],
  advanced: [
    "A {n}-color palette puts this firmly in advanced territory. The range of shades creates nuanced depth, but demands careful color management.",
    "With {n} DMC colors, this pattern delivers photographic detail. Recommend working in well-lit conditions with a light pad for symbol reading.",
    "This {n}-color composition is an ambitious project. The palette depth rewards patience with a genuinely striking finished piece.",
  ],
  expert: [
    "At {n} DMC colors, this is a master-level piece. Exceptional color fidelity comes at the cost of significant organizational complexity.",
    "This {n}-color pattern pushes the limits of what is achievable in diamond painting. For experienced crafters seeking a serious challenge.",
    "With {n} colors, expect the most photorealistic result possible in this medium. This is not a quick project — but the result will be extraordinary.",
  ],
};

const sizeTemplates = {
  small: [
    "The compact {w}×{h} cm canvas makes this a completable project — ideal for a gift, a test run, or working within a limited space.",
    "At {w}×{h} cm, this is sized for a realistic timeframe. Small enough to finish in a handful of sessions.",
    "A {w}×{h} cm canvas: efficient, focused, and achievable. Good choice for anyone who prefers completing projects promptly.",
  ],
  medium: [
    "The {w}×{h} cm canvas hits the sweet spot — enough surface area for genuine visual impact without a months-long commitment.",
    "At {w}×{h} cm, this canvas gives the design room to breathe. Expect clear, recognizable detail in the finished piece.",
    "A {w}×{h} cm canvas is the workhorse of diamond painting. Substantial enough to display proudly, manageable enough to actually finish.",
  ],
  large: [
    "At {w}×{h} cm, this is a statement piece. The additional cells preserve fine detail that smaller sizes sacrifice.",
    "The {w}×{h} cm canvas is where the real detail lives. Portraits especially benefit from this scale — facial features have room to be rendered clearly.",
    "A {w}×{h} cm canvas means commitment, but also quality. Every extra centimeter adds cells that translate directly to sharper, more nuanced output.",
  ],
  'extra-large': [
    "The {w}×{h} cm format is for serious display work. The density of cells at this scale produces results that look professionally commissioned.",
    "At {w}×{h} cm, nothing is compromised for space. This is a long-term project that produces a centerpiece-quality finished piece.",
    "A {w}×{h} cm canvas is as much a craft commitment as a creative one. The result — hung and lit well — is genuinely striking.",
  ],
};

const tipTemplates = {
  beginner: [
    "Tip: Start in one corner and complete one color across the section before switching to the next. This builds visual momentum and keeps your place.",
    "Tip: Use the drill tray to self-orient drills facet-side up before picking up — it's much faster than picking individually from a flat surface.",
    "Tip: Only peel back as much protective film as you can complete in one session. Exposed adhesive attracts dust and loses grip quickly.",
    "Tip: Good lighting transforms the experience. A daylight LED lamp dramatically improves your ability to read symbols and distinguish similar colors.",
  ],
  easy: [
    "Tip: A multi-tip applicator pen (3 or 6 tips) makes large solid areas much faster. Use it for any section covering 20+ cells of one color.",
    "Tip: Press completed sections with a roller or the back of a spoon before moving on — it ensures full adhesion and prevents drills from shifting.",
    "Tip: Sort drill bags by DMC number before starting. Having them organized means color switches take seconds instead of minutes.",
  ],
  intermediate: [
    "Tip: For complex color areas, complete one full row of one color before switching. Even a few minutes of systematic working prevents many errors.",
    "Tip: Use a light pad under the canvas if you have one — it makes symbol reading significantly easier and reduces eye fatigue on long sessions.",
    "Tip: Keep a small container of spare drills from previous sessions. Mixed-color emergencies are rare but useful to prepare for.",
  ],
  advanced: [
    "Tip: Work from the center of complex areas outward. This helps keep dense multi-color sections aligned without gaps or misplacements.",
    "Tip: For portrait sections with subtle skin tone gradients, complete the full range of skin colors in adjacent rows before moving to hair or background.",
    "Tip: Check your work at distance every 30 minutes. Errors visible at arm's length are almost invisible when you are zoomed in close.",
  ],
  expert: [
    "Tip: At this color count, a printed reference with colors highlighted is invaluable. Consider printing sections separately for close work.",
    "Tip: Work with a consistent source of daylight or a color-calibrated lamp. At 60+ colors, distinguishing subtle shade differences is critical.",
    "Tip: Build in regular review sessions — stand back, photograph your progress, and compare to the pattern reference. Drift accumulates over long projects.",
  ],
};

const styleTemplates = [
  "The color distribution suggests {style} — {styleNote}.",
  "Based on the palette, this pattern reads as {style}. {styleNote}",
  "The palette profile indicates {style} character. {styleNote}",
];

// ── Style detection (simplified — based on color count + canvas ratio) ────────
function detectStyle(colorCount, width, height, hash) {
  const ratio = width / height;
  if (colorCount <= 12) return { style: 'graphic / iconic', styleNote: 'Strong shapes and limited palette create bold, clean visual impact.' };
  if (ratio > 1.6) return { style: 'landscape / panoramic', styleNote: 'The wide-format canvas suits horizontal subjects like landscapes and seascapes.' };
  if (ratio < 0.7) return { style: 'portrait / vertical', styleNote: 'Vertical format is ideal for subject portraits, figures, and tall botanical subjects.' };
  if (colorCount >= 50) return { style: 'photorealistic', styleNote: 'The large color count enables fine tonal gradients for photographic-quality output.' };
  if (colorCount >= 30) return { style: 'detailed illustrative', styleNote: 'Enough colors for clear subject detail with natural-looking transitions.' };
  return { style: 'balanced', styleNote: 'A good all-around palette for subjects with clear main colors and supporting tones.' };
}

// ── Main export ───────────────────────────────────────────────────────────────
/**
 * @param {Object} params
 * @param {number} params.colorCount   - Number of DMC colors in the pattern
 * @param {number} params.width        - Canvas width in drill cells
 * @param {number} params.height       - Canvas height in drill cells
 * @param {string} params.drillType    - 'square' | 'round'
 * @returns {Object} description object with string properties
 */
export function generatePatternDescription({ colorCount, width, height, drillType = 'round' }) {
  const totalCells = width * height;
  const hash = hashParams(colorCount, width, height);

  const difficulty = getDifficulty(colorCount, totalCells);
  const sizeLabel = getSizeDescription(width, height);
  const timeEst = getTimeEstimate(totalCells, drillType);
  const canvasRec = getCanvasRecommendation(width, height, drillType);
  const { style, styleNote } = detectStyle(colorCount, width, height, hash);

  // Difficulty sentence
  const diffPool = difficultyTemplates[difficulty];
  const diffSentence = pick(diffPool, hash, 0)
    .replace('{n}', colorCount);

  // Size sentence
  const sizePool = sizeTemplates[sizeLabel];
  const physW = ((width * (drillType === 'square' ? 2.5 : 2.8)) / 10).toFixed(0);
  const physH = ((height * (drillType === 'square' ? 2.5 : 2.8)) / 10).toFixed(0);
  const sizeSentence = pick(sizePool, hash, 1)
    .replace('{w}', physW)
    .replace('{h}', physH);

  // Tip
  const tipPool = tipTemplates[difficulty] || tipTemplates.intermediate;
  const tip = pick(tipPool, hash, 2);

  // Style
  const styleSentence = pick(styleTemplates, hash, 3)
    .replace('{style}', style)
    .replace('{styleNote}', styleNote);

  // Summary (full paragraph)
  const summary = `${diffSentence} ${sizeSentence} Estimated completion time at a comfortable pace: ${timeEst}. ${styleSentence}`;

  return {
    difficulty,
    difficultyLabel: { beginner: 'Beginner', easy: 'Easy', intermediate: 'Intermediate', advanced: 'Advanced', expert: 'Expert' }[difficulty],
    colorCount,
    canvasSize: canvasRec,
    totalDrills: totalCells.toLocaleString(),
    estimatedTime: timeEst,
    style,
    tip,
    summary,
    // Individual sentences for flexible UI use
    difficultyText: diffSentence,
    sizeText: sizeSentence,
    styleText: styleSentence,
  };
}

/**
 * Renders a description card HTML string for insertion into the page.
 * @param {Object} params - same as generatePatternDescription
 * @returns {string} HTML string
 */
export function renderDescriptionCard(params) {
  const d = generatePatternDescription(params);

  const difficultyColors = {
    beginner: '#059669',
    easy: '#0891b2',
    intermediate: '#d97706',
    advanced: '#7c3aed',
    expert: '#dc2626',
  };
  const color = difficultyColors[d.difficulty] || '#617394';

  return `
<div class="pattern-description-card" role="region" aria-label="Pattern summary">
  <div class="pdc-header">
    <span class="pdc-badge" style="background:${color}20;color:${color};border:1px solid ${color}40;">
      ${d.difficultyLabel}
    </span>
    <span class="pdc-title">Pattern Summary</span>
  </div>
  <div class="pdc-stats">
    <div class="pdc-stat">
      <span class="pdc-stat-label">Colors</span>
      <span class="pdc-stat-value">${d.colorCount} DMC</span>
    </div>
    <div class="pdc-stat">
      <span class="pdc-stat-label">Canvas</span>
      <span class="pdc-stat-value">${d.canvasSize}</span>
    </div>
    <div class="pdc-stat">
      <span class="pdc-stat-label">Total Drills</span>
      <span class="pdc-stat-value">${d.totalDrills}</span>
    </div>
    <div class="pdc-stat">
      <span class="pdc-stat-label">Est. Time</span>
      <span class="pdc-stat-value">${d.estimatedTime}</span>
    </div>
  </div>
  <p class="pdc-summary">${d.summary}</p>
  <div class="pdc-tip">
    <span class="pdc-tip-icon" aria-hidden="true">💡</span>
    <span>${d.tip}</span>
  </div>
</div>
  `.trim();
}
