import { useState } from 'react';
import { Button, Icon } from '@/shared/ui';
import type { Creature } from '@/entities/creature';
import { approveCreature, hideCreature, rejectCreature } from '../model/service';

interface ModerationActionsProps {
  creature: Creature;
  /** 승인 시 방류할 구역 */
  targetZoneId: string;
  moderator: string;
  /** 승인 버튼 노출 (pending일 때만 의미 있음) */
  allowApprove?: boolean;
  onDone: (updated: Creature) => void;
}

type Pending = 'approve' | 'reject' | 'hide' | null;

/** 운영 조치 버튼 3종 + 조치 사유. 모든 조치는 사유와 함께 기록된다 (PRD 7.3). */
export function ModerationActions({
  creature,
  targetZoneId,
  moderator,
  allowApprove = true,
  onDone,
}: ModerationActionsProps) {
  const [reason, setReason] = useState('');
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: Exclude<Pending, null>) {
    if ((kind === 'reject' || kind === 'hide') && !reason.trim()) {
      setError('조치 사유를 입력해 주세요. (기록에 남아요)');
      return;
    }
    setPending(kind);
    setError(null);
    try {
      const params = { creatureId: creature.id, moderator, reason: reason.trim() || '가이드 부합' };
      const updated =
        kind === 'approve'
          ? await approveCreature({ ...params, zoneId: targetZoneId })
          : kind === 'reject'
            ? await rejectCreature(params)
            : await hideCreature(params);
      onDone(updated);
      setReason('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '조치에 실패했어요.');
    } finally {
      setPending(null);
    }
  }

  const busy = pending !== null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {allowApprove && (
          <Button variant="primary" className="h-10 flex-1" disabled={busy} onClick={() => run('approve')}>
            <Icon name="check" size={15} className="[stroke-width:2]" />
            승인하고 방류
          </Button>
        )}
        <Button variant="outline" className={allowApprove ? undefined : 'flex-1'} disabled={busy} onClick={() => run('reject')}>
          반려
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => run('hide')}>
          숨김
        </Button>
      </div>
      <div className="flex flex-col gap-[7px]">
        <label className="text-[12.5px] font-semibold text-ink-sub">
          조치 사유 <span className="font-normal text-ink-faint">(기록에 남아요)</span>
        </label>
        <div className="flex h-10 items-center rounded-lg border border-black/15 px-3">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="예: 콘텐츠 가이드 3항에 해당"
            className="flex-1 border-none bg-transparent text-sm outline-none placeholder:text-ink-faint"
          />
        </div>
        {error && <p className="text-[12.5px] text-negative-accessible">{error}</p>}
      </div>
    </div>
  );
}
