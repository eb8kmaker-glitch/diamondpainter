/* ═══════════════════════════════════════════════════════════════
 * DMC 색상 계열(Color Family) 매핑 — create.html 의 DMC_COLORS 원본 불변.
 * 색을 RGB·이름으로 계열에 분류한다(별도 단일 소스). 라벨은 i18n 키(family_<id>)로.
 * 전역 노출: window.DMC_FAMILIES (표시 순서 배열), window.classifyDmcFamily(colorObj)
 * ═══════════════════════════════════════════════════════════════ */
(function () {
  // 표시 순서 (UI 스와치 나열 순서)
  var FAMILIES = [
    { id: 'white_ivory', labelKey: 'family_white_ivory', hex: '#f3efe0',
      keywords: ['white', 'ivory', 'ecru', 'cream', 'snow', 'blanc'] },
    { id: 'yellow_gold',  labelKey: 'family_yellow_gold', hex: '#f2d23c',
      keywords: ['yellow', 'gold', 'lemon', 'citron', 'straw', 'jonquil', 'canary', 'maize', 'mustard', 'daffodil'] },
    { id: 'orange',       labelKey: 'family_orange', hex: '#e87a2c',
      keywords: ['orange', 'tangerine', 'pumpkin', 'apricot'] },
    { id: 'red_pink',     labelKey: 'family_red_pink', hex: '#d64760',
      keywords: ['red', 'pink', 'rose', 'salmon', 'coral', 'raspberry', 'cranberry', 'magenta', 'fuchsia',
                 'watermelon', 'geranium', 'cherry', 'garnet', 'wine', 'carnation', 'bordeaux', 'scarlet',
                 'crimson', 'ruby', 'blush', 'flesh', 'peach'] },
    { id: 'purple',       labelKey: 'family_purple', hex: '#8a5fb0',
      keywords: ['purple', 'violet', 'lavender', 'mauve', 'plum', 'lilac', 'grape', 'orchid',
                 'periwinkle', 'wisteria', 'eggplant'] },
    { id: 'blue',         labelKey: 'family_blue', hex: '#3f6fb5',
      keywords: ['blue', 'navy', 'aqua', 'turquoise', 'teal', 'cobalt', 'sky', 'cornflower',
                 'wedgewood', 'delft', 'peacock', 'indigo', 'denim', 'azure'] },
    { id: 'green',        labelKey: 'family_green', hex: '#4a9c5d',
      keywords: ['green', 'olive', 'moss', 'fern', 'pistachio', 'jade', 'mint', 'sage', 'kelly',
                 'hunter', 'avocado', 'chartreuse', 'loden', 'celadon', 'emerald', 'forest', 'seafoam', 'parrot'] },
    { id: 'brown_beige',  labelKey: 'family_brown_beige', hex: '#9a6b43',
      keywords: ['brown', 'beige', 'tan', 'khaki', 'coffee', 'mocha', 'chocolate', 'hazelnut', 'sand',
                 'taupe', 'sepia', 'umber', 'chestnut', 'mahogany', 'cinnamon', 'terracotta', 'rust',
                 'camel', 'fawn', 'drab', 'biscuit', 'caramel', 'topaz', 'wheat', 'brick', 'cocoa', 'walnut', 'toast'] },
    { id: 'gray_silver',  labelKey: 'family_gray_silver', hex: '#9aa0aa',
      keywords: ['gray', 'grey', 'silver', 'steel', 'pewter', 'ash', 'slate', 'charcoal', 'smoke'] },
    { id: 'black',        labelKey: 'family_black', hex: '#1a1a1a',
      keywords: ['black'] }
  ];

  // 키워드 매칭 우선순위 (애매한 합성명 처리: 무채색·갈색 먼저)
  var PRIORITY = ['black', 'white_ivory', 'gray_silver', 'brown_beige',
                  'purple', 'blue', 'green', 'orange', 'yellow_gold', 'red_pink'];

  var BY_ID = {};
  FAMILIES.forEach(function (f) {
    BY_ID[f.id] = f;
    f._re = new RegExp('\\b(' + f.keywords.join('|') + ')\\b', 'i'); // 단어 경계(tan ≠ tangerine)
  });

  function classifyByRgb(rgb) {
    var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var l = (max + min) / 2, d = max - min;
    var s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    var h = 0;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    if (l < 0.10) return 'black';
    if (s < 0.12) return l > 0.85 ? 'white_ivory' : 'gray_silver';
    if (h >= 20 && h < 50 && (l < 0.5 || s < 0.45)) return 'brown_beige';
    if (h < 20 || h >= 335) return 'red_pink';
    if (h < 50) return 'orange';
    if (h < 70) return 'yellow_gold';
    if (h < 165) return 'green';
    if (h < 255) return 'blue';
    if (h < 290) return 'purple';
    return 'red_pink';
  }

  function classifyDmcFamily(color) {
    var name = (color && color.name) ? color.name : '';
    for (var i = 0; i < PRIORITY.length; i++) {
      var f = BY_ID[PRIORITY[i]];
      if (f._re.test(name)) return f.id;
    }
    return classifyByRgb(color.rgb || [0, 0, 0]);
  }

  window.DMC_FAMILIES = FAMILIES;
  window.classifyDmcFamily = classifyDmcFamily;
})();
