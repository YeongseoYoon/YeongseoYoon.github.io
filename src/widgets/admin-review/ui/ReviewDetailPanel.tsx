import { formatSubmittedAt } from '@/shared/lib';
import { CreatureSprite, KindBadge, spriteBaseSize, type Creature } from '@/entities/creature';
import type { ModerationLog } from '@/entities/moderation-log';
import { reportReasonLabel, type Report } from '@/entities/report';
import { ModerationActions } from '@/features/moderate-creature';
import { ModerationLogTimeline } from './ModerationLogTimeline';

interface ReviewDetailPanelProps {
  creature: Creature;
  targetZoneId: string;
  moderator: string;
  logs: ModerationLog[];
  /** 신고 큐에서 선택된 경우 누적 신고 목록 */
  reports?: Report[];
  onActionDone: (updated: Creature) => void;
}

/** 우측 상세 패널 — 미리보기 + 메타 + 조치 + 최근 기록 (PRD 7.3). */
export function ReviewDetailPanel({
  creature,
  targetZoneId,
  moderator,
  logs,
  reports,
  onActionDone,
}: ReviewDetailPanelProps) {
  const [w, h] = spriteBaseSize(creature.spriteKey);

  return (
    <div className="flex w-full shrink-0 flex-col overflow-y-auto border-t border-black/10 bg-white md:w-[380px] md:border-t-0 lg:w-[460px]">
      <div className="flex flex-col gap-4 px-6 pt-5">
        <div className="water-tank relative h-[170px] overflow-hidden rounded-2xl">
          <div className="absolute inset-0 grid place-items-center">
            <CreatureSprite creature={creature} width={w * 6.5} height={h * 6.5} />
          </div>
          <span className="absolute left-3 top-2.5 rounded-full bg-white/[.78] px-2.5 py-1 text-[11px] font-bold text-sea-deep">
            실제 움직임 미리보기
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-bold">{creature.name}</span>
              <KindBadge kind={creature.kind} />
            </div>
            <span className="text-[12.5px] text-ink-faint">
              {creature.status} · #{creature.id.slice(-4)}
            </span>
          </div>
          <div className="rounded-[10px] bg-[#f1f2f3] px-3.5 py-[11px] text-[13.5px]">
            작품 메시지 · “{creature.message}”
          </div>
          {reports && reports.length > 0 && (
            <div className="flex flex-col gap-1 rounded-[10px] bg-negative-bg px-3.5 py-[11px]">
              <span className="text-[12.5px] font-semibold text-negative-accessible">
                신고 {reports.length}건 누적
              </span>
              <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[12px] text-negative-accessible/90">
                {reports.map((r) => (
                  <li key={r.id}>
                    · {reportReasonLabel(r.reason)}
                    {r.detail && <span className="text-ink-sub"> — “{r.detail}”</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-5 text-[12.5px] text-ink-soft">
            <span>
              창작자 <strong className="font-semibold text-ink">{creature.authorNickname ?? '무명'}</strong>
            </span>
            <span>
              제출{' '}
              <strong className="font-semibold text-ink">
                {formatSubmittedAt(creature.submittedAt ?? creature.createdAt)}
              </strong>
            </span>
          </div>
        </div>

        <ModerationActions
          key={creature.id}
          creature={creature}
          targetZoneId={targetZoneId}
          moderator={moderator}
          allowApprove={creature.status === 'pending'}
          onDone={onActionDone}
        />
      </div>

      <div
        className="mt-[18px] border-t border-black/[.07] px-6 pt-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
      >
        <ModerationLogTimeline logs={logs} />
      </div>
    </div>
  );
}
