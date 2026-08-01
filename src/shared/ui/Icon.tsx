import type { SVGProps } from 'react';

/**
 * 인라인 SVG 아이콘 세트 (stroke 1.6, currentColor).
 * 핸드오프의 인라인 아이콘을 한 곳으로 모아 중복을 제거한다(응집도).
 */
export type IconName =
  | 'chevron-right'
  | 'chevron-left'
  | 'close'
  | 'user'
  | 'warning'
  | 'check'
  | 'settings'
  | 'edit'
  | 'eyedropper'
  | 'trash'
  | 'eraser'
  | 'undo'
  | 'redo'
  | 'plus'
  | 'minus'
  | 'filter'
  | 'share'
  | 'copy'
  | 'download';

const PATHS: Record<IconName, JSX.Element> = {
  'chevron-right': <path d="m9 6 6 6-6 6" />,
  'chevron-left': <path d="m15 6-6 6 6 6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  warning: (
    <>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  check: <path d="M5 12.5 9.5 17 19 7" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </>
  ),
  edit: (
    <>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </>
  ),
  eyedropper: (
    <>
      <path d="m19 3 2 2-9.5 9.5-2-2Z" />
      <path d="m14 6 4 4" />
      <path d="m9.5 12.5-5.2 5.2a2 2 0 0 0-.6 1.4V21h1.9a2 2 0 0 0 1.4-.6l5-5" />
    </>
  ),
  trash: <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />,
  eraser: (
    <>
      <path d="M17 3 21 7a2 2 0 0 1 0 2.8L11.8 19H7l-3-3a2 2 0 0 1 0-2.8L14.2 3a2 2 0 0 1 2.8 0Z" />
      <path d="M7 19h14" />
    </>
  ),
  undo: <path d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3" />,
  redo: <path d="m15 14 5-5-5-5M20 9H9a5 5 0 0 0 0 10h3" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  filter: <path d="M22 3H2l8 9.46V19l4 2v-8.54Z" />,
  share: (
    <>
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
    </>
  ),
  copy: <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
  download: <><path d="M12 3v12m0 0 5-5m-5 5-5-5" /><path d="M5 21h14" /></>,
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
