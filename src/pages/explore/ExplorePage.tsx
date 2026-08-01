import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Icon, Screen, Toast, WaterBackground } from '@/shared/ui';
import { useAsync } from '@/shared/lib';
import { isSupabaseMode, subscribeToServerChanges } from '@/shared/api';
import { creatureApi, FLOOR_Y, SWIM_BAND, type Creature } from '@/entities/creature';
import { ReportModal } from '@/features/report-creature';
import { AquariumMap, useMapViewport, toWorldCreatures, worldWidthFor } from '@/widgets/aquarium-map';
import { CreatureDetailSheet } from '@/widgets/creature-detail-sheet';

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
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const { data: allPublished, refetch } = useAsync(() => creatureApi.listByStatus('published'), []);
  useEffect(() => {
    if (!isSupabaseMode) return;
    return subscribeToServerChanges(['creatures'], refetch);
  }, [refetch]);
  const visible = useMemo(
    () => (allPublished ?? []).filter((c) => !hiddenIds.has(c.id)),
    [allPublished, hiddenIds],
  );

  const contentWidth = useMemo(() => worldWidthFor(visible), [visible]);
  const placed = useMemo(() => toWorldCreatures(visible), [visible]);
  const viewport = useMapViewport({ contentWidth, contentHeight: SWIM_BAND, floorY: FLOOR_Y });

  // "이동하기"로 들어오면 해당 생물 위치(가로)로 확대 이동.
  const focusedOnce = useRef<string | null>(null);
  useEffect(() => {
    if (!focusId || focusedOnce.current === focusId) return;
    const target = placed.find((p) => p.creature.id === focusId);
    if (target) {
      focusedOnce.current = focusId;
      viewport.focusOn(target.x + target.w / 2, target.y + target.h / 2, viewport.maxZoom);
      setToast('내가 방류한 생물이에요');
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
          <span className="text-[11px] text-sea-mid">생물 {visible.length} · 드래그해서 둘러보기</span>
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

      {selected && !reporting && (
        <CreatureDetailSheet
          creature={selected}
          onClose={() => {
            setSelected(null);
            if (focusId) setParams({}, { replace: true });
          }}
          onReport={() => setReporting(true)}
        />
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
