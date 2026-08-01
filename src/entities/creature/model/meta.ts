import type { BadgeTone } from '@/shared/ui';
import type { CreatureKind, CreatureStatus, MotionKind } from './types';

/** 종류 → 라벨/기본 움직임/뱃지 톤. 종류별 규칙을 한곳에 모은다(응집도). */
interface KindMeta {
  label: string;
  motion: MotionKind;
  tone: BadgeTone;
}

export const KIND_META: Record<CreatureKind, KindMeta> = {
  fish: { label: '물고기', motion: 'swim', tone: 'brand' },
  seaweed: { label: '해초', motion: 'sway', tone: 'positive' },
  decoration: { label: '장식물', motion: 'still', tone: 'secondary' },
};

/** 종류에 따라 자동 적용할 움직임 (PRD 7.1). */
export function motionForKind(kind: CreatureKind): MotionKind {
  return KIND_META[kind].motion;
}

interface StatusMeta {
  label: string;
  tone: BadgeTone;
}

/** 상태 → 창작자에게 보여줄 라벨/색. (내 수조·상세) */
export const STATUS_META: Record<CreatureStatus, StatusMeta> = {
  draft: { label: '임시저장', tone: 'neutral' },
  pending: { label: '검토 대기', tone: 'warning' },
  published: { label: '공개됨', tone: 'positive' },
  rejected: { label: '반려됨', tone: 'negative' },
  hidden: { label: '숨김 처리', tone: 'negative' },
  deleted: { label: '삭제됨', tone: 'neutral' },
};
