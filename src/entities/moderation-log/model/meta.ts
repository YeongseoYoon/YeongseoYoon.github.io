import type { ModerationAction } from './types';

interface ActionMeta {
  label: string;
  /** 타임라인 점 색 (positive=승인 계열, negative=숨김/삭제 계열) */
  tone: 'positive' | 'negative' | 'neutral';
}

export const ACTION_META: Record<ModerationAction, ActionMeta> = {
  approve: { label: '승인', tone: 'positive' },
  reject: { label: '반려', tone: 'negative' },
  hide: { label: '숨김', tone: 'negative' },
  temp_hide: { label: '임시 숨김', tone: 'negative' },
  delete: { label: '삭제', tone: 'negative' },
  restrict_user: { label: '창작자 제한', tone: 'neutral' },
};
