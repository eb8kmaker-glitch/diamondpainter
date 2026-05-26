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

  // ── 예시 항목 (실제 이미지로 교체하세요) ──────────────────────────────────
  // {
  //   id: 1,
  //   title: "Golden Retriever",
  //   title_ko: "골든 리트리버",
  //   category: "pets",
  //   image: "gallery/images/golden-retriever.jpg",
  //   colors: 32,
  //   size: "40×50cm",
  //   featured: true
  // },
  // {
  //   id: 2,
  //   title: "Mountain Landscape",
  //   title_ko: "산 풍경",
  //   category: "landscapes",
  //   image: "gallery/images/mountain.jpg",
  //   colors: 28,
  //   size: "50×70cm"
  // },

];
