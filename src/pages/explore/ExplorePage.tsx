import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Icon, Screen, Toast, WaterBackground } from '@/shared/ui';
import { useAsync } from '@/shared/lib';
import { isSupabaseMode, subscribeToServerChanges } from '@/shared/api';
import { creatureApi, FLOOR_Y, SWIM_BAND, type Creature } from '@/entities/creature';
import { ReportModal } from '@/features/report-creature';
import { ShareCreatureSheet } from '@/features/share-creature';
import { AquariumMap, useMapViewport, toWorldCreatures, worldWidthFor } from '@/widgets/aquarium-map';
import { CreatureDetailSheet } from '@/widgets/creature-detail-sheet';

/** 카메라 이동 중 매 픽셀마다 재조회하지 않도록 범위를 큰 셀에 맞춘다. */
const QUERY_CELL = 1_600;
const QUERY_MARGIN = 700;
const QUERY_LIMIT = 300;

/**
 * 지도형 수족관 탐험 (PRD 7.2 · 9).
 * 하나의 큰 바다를 팬/줌으로 넓게·좁게 본다. 생물이 많아질수록 월드가 넓어진다.
 * 넓게 보면 생물이 작아지고 메시지는 숨고, 좁게 보면 커지며 한마디가 보인다.
 */
export function ExplorePage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const focusId = params.get('focus');

  const [selected, setSelected] = useState<Creature | null>(null);
  const [reporting, setReporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const { data: publicStats, refetch: refetchStats } = useAsync(
    () => creatureApi.getPublicStats(),
    [],
  );
  const contentWidth = useMemo(
    () => worldWidthFor([{ worldX: publicStats?.maxWorldX ?? 0 }]),
    [publicStats?.maxWorldX],
  );
  const viewport = useMapViewport({ contentWidth, contentHeight: SWIM_BAND, floorY: FLOOR_Y });

  const queryRange = useMemo(() => {
    if (!viewport.size.w || !viewport.zoom) return { min: 0, max: QUERY_CELL * 2 };
    const left = -viewport.pan.x / viewport.zoom;
    const right = left + viewport.size.w / viewport.zoom;
    return {
      min: Math.floor((left - QUERY_MARGIN) / QUERY_CELL) * QUERY_CELL,
      max: Math.ceil((right + QUERY_MARGIN) / QUERY_CELL) * QUERY_CELL,
    };
  }, [viewport.pan.x, viewport.size.w, viewport.zoom]);

  const { data: nearbyPublished, refetch: refetchNearby } = useAsync(
    () => creatureApi.listPublicInWorldRange(queryRange.min, queryRange.max, QUERY_LIMIT),
    [queryRange.min, queryRange.max],
  );
  const { data: focusedCreature, refetch: refetchFocused } = useAsync(
    () => (focusId ? creatureApi.get(focusId) : Promise.resolve(null)),
    [focusId],
  );

  useEffect(() => {
    if (!isSupabaseMode) return;
    return subscribeToServerChanges(['creatures'], () => {
      refetchStats();
      refetchNearby();
      if (focusId) refetchFocused();
    });
  }, [focusId, refetchFocused, refetchNearby, refetchStats]);

  const visible = useMemo(
    () => {
      const byId = new Map((nearbyPublished ?? []).map((creature) => [creature.id, creature]));
      if (focusedCreature?.status === 'published') byId.set(focusedCreature.id, focusedCreature);
      return [...byId.values()].filter((creature) => !hiddenIds.has(creature.id));
    },
    [focusedCreature, hiddenIds, nearbyPublished],
  );

  const placed = useMemo(() => toWorldCreatures(visible), [visible]);

  // "이동하기"로 들어오면 해당 생물 위치(가로)로 확대 이동.
  const focusedOnce = useRef<string | null>(null);
  useEffect(() => {
    if (!focusId || focusedOnce.current === focusId) return;
    const target = placed.find((p) => p.creature.id === focusId);
    if (target) {
      focusedOnce.current = focusId;
      viewport.focusOn(target.x + target.w / 2, target.y + target.h / 2, viewport.maxZoom);
      setSelected(target.creature);
      setToast('공유된 생물을 찾았어요');
    }
  }, [focusId, placed, viewport]);

  function handleReported(hide: boolean) {
    if (selected && hide) setHiddenIds((prev) => new Set(prev).add(selected.id));
    setReporting(false);
    setSelected(null);
    setToast('신고가 접수됐어요. 운영자가 확인할게요.');
  }

  return (
    <Screen variant="full">
      <WaterBackground variant="sea" />

      <AquariumMap placed={placed} viewport={viewport} onSelect={setSelected} />

      {/* 정보 카드 */}
      <div className="absolute inset-x-5 top-6 z-10 flex items-start justify-between">
        <div className="flex flex-col gap-0.5 rounded-2xl bg-white/70 px-3.5 py-2.5 shadow-[0_2px_10px_rgba(9,62,70,.12)] backdrop-blur">
          <span className="text-sm font-bold tracking-tight text-sea-deep">끝없는 바다</span>
          <span className="text-[11px] text-sea-mid">
            생물 {publicStats?.count ?? visible.length} · 드래그해서 둘러보기
          </span>
        </div>
        <button
          onClick={() => navigate('/my-tank')}
          aria-label="내 수조"
          className="grid h-[42px] w-[42px] place-items-center rounded-full bg-white/70 text-sea-deep shadow-[0_2px_10px_rgba(9,62,70,.12)] backdrop-blur"
        >
          <Icon name="user" size={19} />
        </button>
      </div>

      {/* 지도 줌 컨트롤 */}
      <div className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2 flex-col rounded-full bg-white/70 shadow-[0_2px_10px_rgba(9,62,70,.14)] backdrop-blur">
        <button className="grid h-11 w-11 place-items-center text-sea-deep" aria-label="가까이" onClick={viewport.zoomIn}>
          <Icon name="plus" size={18} />
        </button>
        <span className="mx-3 h-px bg-sea-deep/15" />
        <button className="grid h-11 w-11 place-items-center text-sea-deep" aria-label="넓게" onClick={viewport.zoomOut}>
          <Icon name="minus" size={18} />
        </button>
      </div>

      {toast && <Toast>{toast}</Toast>}

      <div
        className="absolute inset-x-0 z-10 flex justify-center"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)' }}
      >
        <Button variant="primary" size="pill" className="shadow-lg" onClick={() => navigate('/draw')}>
          + 나도 방류하기
        </Button>
      </div>

      {selected && !reporting && !sharing && (
        <CreatureDetailSheet
          creature={selected}
          onClose={() => {
            setSelected(null);
            if (focusId) setParams({}, { replace: true });
          }}
          onReport={() => setReporting(true)}
          onShare={() => setSharing(true)}
        />
      )}

      {selected && sharing && (
        <ShareCreatureSheet creature={selected} onClose={() => setSharing(false)} />
      )}

      {selected && reporting && (
        <ReportModal
          creatureId={selected.id}
          creatureName={selected.name}
          onClose={() => setReporting(false)}
          onSubmitted={handleReported}
        />
      )}
    </Screen>
  );
}
