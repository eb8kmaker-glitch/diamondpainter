/**
 * Diamond Painter — Gallery Data
 *
 * 새 도안 추가 방법:
 * 1. 이미지 파일을 gallery/images/ 폴더에 추가
 * 2. 아래 GALLERY_DATA 배열에 항목 추가
 * 3. 커밋 & 배포
 *
 * To add a new pattern:
 * 1. Place the image in the gallery/images/ folder
 * 2. Add an entry to the GALLERY_DATA array below
 * 3. Commit and deploy
 *
 * Fields:
 *   id       — unique integer
 *   title    — English title (shown in card and lightbox)
 *   title_ko — Korean title (optional; falls back to title)
 *   category — "pets" | "portraits" | "landscapes" | "anime" | "other"
 *   image    — path from site root, e.g. "gallery/images/my-pattern.jpg"
 *   colors   — number of DMC colors used (optional)
 *   size     — canvas size string, e.g. "40×50cm" (optional)
 *   featured — true to pin to the top (optional)
 */
const GALLERY_DATA = [

  {
    id: 1,
    title: "Garden Landscape Window",
    title_ko: "정원 풍경 스테인드글라스",
    category: "landscapes",
    image:    "gallery/images/tiffany-garden-window_pattern.png",   // 갤러리 썸네일 = 도안
    original: "gallery/images/tiffany-garden-window_original.jpg",  // 원본 사진
    pattern:  "gallery/images/tiffany-garden-window_pattern.png",   // 도안
    preview:  "gallery/images/tiffany-garden-window_preview.jpg",    // 예상도 이미지
    patternJson: "gallery/images/tiffany-garden-window_pattern.json", // 예상도 렌더링용 패턴 데이터
    colors: 35,
    size: "100×52.5cm",
    featured: true,
    attribution: "Agnes F. Northrop / Tiffany Studios, 1912 · The Metropolitan Museum of Art (Public Domain)"
  },


  {
    id: 2,
    title: "Orange Cat Portrait",
    title_ko: "고양이 키키 초상화",
    category: "pets",
    image:    "gallery/images/kiki241025_pattern.png",
    original: "gallery/images/kiki241025_original.jpg",
    pattern:  "gallery/images/kiki241025_pattern.png",
    preview:  "gallery/images/kiki241025_preview.jpg",
    patternJson: "gallery/images/kiki241025_pattern.json",
    colors: 50,
    size: "50×50cm",
    featured: true,
  },


  {
    id: 3,
    title: "Red Rose with Dewdrops",
    title_ko: "이슬 맺힌 빨간 장미",
    category: "other",
    image:    "gallery/images/ray_shrewsberry-ai-generated-8523494_1920_pattern.png",
    original: "gallery/images/ray_shrewsberry-ai-generated-8523494_1920_original.jpg",
    pattern:  "gallery/images/ray_shrewsberry-ai-generated-8523494_1920_pattern.png",
    preview:  "gallery/images/ray_shrewsberry-ai-generated-8523494_1920_preview.jpg",
    patternJson: "gallery/images/ray_shrewsberry-ai-generated-8523494_1920_pattern.json",
    colors: 25,
    size: "50×50cm",
    attribution: "Original image by Ray Shrewsberry · Pixabay (AI-generated, free to use)",
  },

];
