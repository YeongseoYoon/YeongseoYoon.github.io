import { useMemo, useState } from 'react';
import { assetUrl, cn } from '@/shared/lib';
import type { Creature } from '@/entities/creature';
import { SEED_ZONE_ID } from '@/entities/zone';
import { useSession } from '@/entities/session';
import { displayName } from '@/entities/user';
import { useAdminData } from '../model/useAdminData';
import { QueueRow } from './QueueRow';
import { ReviewDetailPanel } from './ReviewDetailPanel';
import { ZonePanel } from './ZonePanel';

type Tab = 'review' | 'reports' | 'zones';

/** 운영자 검토 콘솔 (PRD 7.3). 검토 대기·신고·구역 관리를 한 화면에서. */
export function AdminConsole() {
  const { user } = useSession();
  const { pending, reportGroups, logs, refetch } = useAdminData();
  // 사후 검토 모델: 신고 큐가 주 작업. 기본 탭을 신고로.
  const [tab, setTab] = useState<Tab>('reports');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const moderator = displayName({ nickname: user?.nickname ?? null });
  const targetZoneId = SEED_ZONE_ID.coral;

  const rows: Creature[] = tab === 'reports' ? reportGroups.map((g) => g.creature) : pending;
  const selected = useMemo(() => rows.find((c) => c.id === selectedId) ?? rows[0] ?? null, [rows, selectedId]);
  const selectedReports = reportGroups.find((g) => g.creature.id === selected?.id)?.reports;

  function handleActionDone() {
    setSelectedId(null);
    refetch();
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col overflow-hidden bg-[#f1f2f3] lg:rounded-2xl lg:shadow-[0_18px_48px_rgba(23,68,76,.16),0_0_0_1px_rgba(35,36,42,.08)]">
      {/* 탑바 */}
      <div className="flex h-[60px] shrink-0 items-center justify-between gap-3 border-b border-black/10 bg-white px-4 sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] bg-brand">
            <img src={assetUrl('minnow.png')} width={20} height={13} className="pixel" alt="" />
          </span>
          <span className="truncate whitespace-nowrap text-[15px] font-bold tracking-tight">
            끝없는 수족관 <span className="font-medium text-ink-soft">운영 콘솔</span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <span className="hidden text-[13px] text-ink-soft sm:inline">마지막 동기화 방금 전</span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-[13px] font-semibold text-white">
            {moderator.slice(0, 1)}
          </span>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex shrink-0 gap-1 border-b border-black/10 bg-white px-7">
        <TabButton active={tab === 'review'} onClick={() => { setTab('review'); setSelectedId(null); }} badge={pending.length} badgeTone="brand">
          검토 대기
        </TabButton>
        <TabButton active={tab === 'reports'} onClick={() => { setTab('reports'); setSelectedId(null); }} badge={reportGroups.length} badgeTone="negative">
          신고
        </TabButton>
        <TabButton active={tab === 'zones'} onClick={() => setTab('zones')}>
          구역 관리
        </TabButton>
      </div>

      {/* 본문 */}
      {tab === 'zones' ? (
        <div className="min-h-0 flex-1 overflow-y-auto bg-white">
          <ZonePanel />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto border-black/10 bg-white md:border-r">
            <div className="flex items-center justify-between border-b border-black/[.07] px-6 py-3.5">
              <span className="text-[13px] text-ink-soft">
                {tab === 'review' ? `오래된 순 · ${pending.length}건` : `신고 많은 순 · ${reportGroups.length}건`}
              </span>
            </div>
            {rows.length === 0 && (
              <p className="px-6 py-10 text-center text-[13px] text-ink-faint">
                {tab === 'review' ? '검토할 작품이 없어요.' : '처리할 신고가 없어요.'}
              </p>
            )}
            {rows.map((creature) => (
              <QueueRow
                key={creature.id}
                creature={creature}
                selected={selected?.id === creature.id}
                onSelect={() => setSelectedId(creature.id)}
              />
            ))}
          </div>

          {selected ? (
            <ReviewDetailPanel
              creature={selected}
              targetZoneId={targetZoneId}
              moderator={moderator}
              logs={logs}
              reports={tab === 'reports' ? selectedReports : undefined}
              onActionDone={handleActionDone}
            />
          ) : (
            <div className="hidden w-full shrink-0 place-items-center bg-white text-sm text-ink-faint md:grid md:w-[380px] lg:w-[460px]">
              작품을 선택하세요
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
  badge,
  badgeTone = 'brand',
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  badge?: number;
  badgeTone?: 'brand' | 'negative';
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        '-mb-px flex items-center gap-[7px] border-b-2 px-3 py-3.5 text-sm font-semibold',
        active ? 'border-brand text-ink' : 'border-transparent text-ink-sub',
      )}
    >
      {children}
      {badge != null && badge > 0 && (
        <span className={cn('inline-flex h-[18px] items-center rounded-full px-1.5 text-[11px] font-semibold text-white', badgeTone === 'brand' ? 'bg-brand' : 'bg-negative')}>
          {badge}
        </span>
      )}
    </button>
  );
}
