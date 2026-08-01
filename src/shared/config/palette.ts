/**
 * 그리기 팔레트 — 디자인 핸드오프의 12색 고정 팔레트.
 * "제한된 색상 팔레트" 제약(PRD 7.1)을 코드로 고정한다.
 */
export const DRAW_PALETTE = [
  '#f8820d',
  '#E54A1A',
  '#E5C51A',
  '#aed629',
  '#33CC95',
  '#21AFBF',
  '#0fbbf0',
  '#3355CC',
  '#A026D9',
  '#df2070',
  '#23242a',
  '#ffffff',
] as const;

export type PaletteColor = (typeof DRAW_PALETTE)[number];
