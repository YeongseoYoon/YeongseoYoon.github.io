/** 조건부 className 결합 헬퍼. falsy 값은 제거한다. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
