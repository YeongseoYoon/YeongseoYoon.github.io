import { Badge } from '@/shared/ui';
import type { CreatureKind, CreatureStatus } from '../model/types';
import { KIND_META, STATUS_META } from '../model/meta';

/** 종류 뱃지 (물고기/해초/장식물). */
export function KindBadge({ kind }: { kind: CreatureKind }) {
  const meta = KIND_META[kind];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

/** 상태 뱃지 (공개됨/검토 대기/반려됨 …). */
export function StatusBadge({ status }: { status: CreatureStatus }) {
  const meta = STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
