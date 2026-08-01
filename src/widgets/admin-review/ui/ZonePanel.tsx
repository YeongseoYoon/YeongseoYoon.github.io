import { useState } from 'react';
import { cn } from '@/shared/lib';
import { useAsync } from '@/shared/lib';
import { creatureApi } from '@/entities/creature';
import { occupancyRatio, zoneApi, type Zone } from '@/entities/zone';

/** 구역 관리 — 수용량 확인 + 신규 방류 일시 중지 토글 (PRD 7.3). */
export function ZonePanel() {
  const { data: zones, refetch } = useAsync(() => zoneApi.list(), []);

  return (
    <div className="flex flex-col gap-3 p-6">
      <span className="text-[13px] font-bold text-ink-sub">구역별 공개량</span>
      {(zones ?? [])
        .sort((a, b) => a.order - b.order)
        .map((zone) => (
          <ZoneRow key={zone.id} zone={zone} onToggled={refetch} />
        ))}
    </div>
  );
}

function ZoneRow({ zone, onToggled }: { zone: Zone; onToggled: () => void }) {
  const { data: creatures } = useAsync(() => creatureApi.listByZone(zone.id), [zone.id]);
  const [busy, setBusy] = useState(false);
  const count = creatures?.length ?? 0;
  const ratio = occupancyRatio(count, zone.capacity);

  async function toggle() {
    setBusy(true);
    await zoneApi.update(zone.id, { acceptingReleases: !zone.acceptingReleases });
    setBusy(false);
    onToggled();
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-black/[.08] bg-white px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 pr-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{zone.name}</span>
          <span className="text-[11.5px] text-ink-faint">
            수용량 {count}/{zone.capacity}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
          <div
            className={cn('h-full rounded-full', ratio > 0.85 ? 'bg-negative' : 'bg-brand')}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
      </div>
      <button
        onClick={toggle}
        disabled={busy}
        aria-pressed={zone.acceptingReleases}
        className={cn('relative h-5 w-9 rounded-full transition-colors', zone.acceptingReleases ? 'bg-brand' : 'bg-black/20')}
      >
        <i
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
            zone.acceptingReleases ? 'right-0.5' : 'left-0.5',
          )}
        />
      </button>
    </div>
  );
}
