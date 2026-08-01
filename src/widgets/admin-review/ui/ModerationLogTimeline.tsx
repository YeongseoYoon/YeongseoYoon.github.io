import { formatSubmittedAt } from '@/shared/lib';
import { ACTION_META, type ModerationLog } from '@/entities/moderation-log';

const DOT_COLOR = {
  positive: 'bg-positive',
  negative: 'bg-negative',
  neutral: 'bg-ink-faint',
} as const;

/** 최근 조치 기록 타임라인 (PRD 7.3: 모든 조치에 운영자·시각·사유). */
export function ModerationLogTimeline({ logs }: { logs: ModerationLog[] }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[12.5px] font-bold text-ink-sub">최근 조치 기록</span>
      {logs.length === 0 && <span className="text-xs text-ink-faint">아직 기록이 없어요.</span>}
      {logs.map((log) => {
        const meta = ACTION_META[log.action];
        return (
          <div key={log.id} className="flex items-start gap-2.5">
            <span className={`mt-[5px] h-[7px] w-[7px] shrink-0 rounded-full ${DOT_COLOR[meta.tone]}`} />
            <div className="flex flex-col gap-px">
              <span className="text-[13px]">
                <strong className="font-semibold">{meta.label}</strong> · {log.reason}
              </span>
              <span className="text-xs text-ink-faint">
                {log.moderator} · {formatSubmittedAt(log.createdAt)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
