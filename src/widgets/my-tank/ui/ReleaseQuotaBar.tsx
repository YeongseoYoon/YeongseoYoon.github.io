import { cn } from '@/shared/lib';
import type { ReleaseQuota } from '@/features/release-creature';

/** 오늘 방류 한도 표시 (3칸 중 사용분 채움). */
export function ReleaseQuotaBar({ quota }: { quota: ReleaseQuota }) {
  return (
    <div className="mx-5 mt-3.5 flex shrink-0 items-center justify-between rounded-xl bg-[#f1f2f3] px-3.5 py-[11px]">
      <span className="text-[13px] font-semibold text-ink-sub">오늘 방류 한도</span>
      <div className="flex items-center gap-2">
        <span className="inline-flex gap-1">
          {Array.from({ length: quota.limit }).map((_, i) => (
            <i key={i} className={cn('h-1.5 w-[22px] rounded-full', i < quota.used ? 'bg-brand' : 'bg-black/10')} />
          ))}
        </span>
        <span className="text-[12.5px] font-semibold text-brand-accessible">
          {quota.used}/{quota.limit}회 사용
        </span>
      </div>
    </div>
  );
}
