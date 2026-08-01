import { useMemo } from 'react';
import { cn } from '@/shared/lib';
import { Bubbles } from '@/shared/ui';
import { WANDER_RADIUS, type Creature } from '@/entities/creature';
import type { WorldCreature } from '../model/world';
import type { Viewport } from '../model/useMapViewport';
import { SwimField } from './SwimField';

interface AquariumMapProps {
  placed: WorldCreature[];
  viewport: Viewport;
  onSelect: (creature: Creature) => void;
}

/** 메시지가 보이기 시작하는 줌 (좁게 볼 때만 — PRD 제품원칙 5). */
const MESSAGE_ZOOM = 0.95;
/** 이 아래에서는 그림자 등 비싼 효과를 끈다. */
const LOW_DETAIL_ZOOM = 0.6;
/** 컬링 경계를 이 격자로 스냅 — 매 픽셀마다 가시 목록이 바뀌지 않도록. */
const CULL_CELL = 320;

/**
 * 오픈월드 바다 뷰.
 * 바닥은 **화면 공간 레이어**라 화면 크기·브라우저 배율과 무관하게 항상 그려진다.
 * 화면 밖 생물은 렌더하지 않는다(가상화).
 */
export function AquariumMap({ placed, viewport, onSelect }: AquariumMapProps) {
  const { zoom, pan, size, floorScreenY } = viewport;
  const showMessages = zoom >= MESSAGE_ZOOM;
  const lowDetail = zoom < LOW_DETAIL_ZOOM;

  const bounds = useMemo(() => {
    const snap = (v: number, dir: -1 | 1) =>
      (dir < 0 ? Math.floor(v / CULL_CELL) : Math.ceil(v / CULL_CELL)) * CULL_CELL;
    const left = -pan.x / zoom;
    const top = -pan.y / zoom;
    return {
      left: snap(left - WANDER_RADIUS, -1),
      right: snap(left + size.w / zoom + WANDER_RADIUS, 1),
      top: snap(top - WANDER_RADIUS, -1),
      bottom: snap(top + size.h / zoom + WANDER_RADIUS, 1),
    };
  }, [pan.x, pan.y, zoom, size.w, size.h]);

  const visible = useMemo(
    () =>
      placed.filter(
        (p) =>
          p.x + p.w >= bounds.left &&
          p.x <= bounds.right &&
          p.y + p.h >= bounds.top &&
          p.y <= bounds.bottom,
      ),
    [placed, bounds],
  );

  return (
    <div
      {...viewport.bind}
      className="absolute inset-0 touch-none overflow-hidden"
      style={{ cursor: 'grab' }}
    >
      {/* 생물 레이어 (월드 좌표) */}
      <div
        className={cn('absolute left-0 top-0', showMessages && 'show-msg')}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <SwimField
          visible={visible}
          onSelect={onSelect}
          didDrag={viewport.didDrag}
          lowDetail={lowDetail}
        />
      </div>

      {/*
        모래 바닥 — 화면 공간. 좌우로 무한하고 항상 화면 아래까지 채운다.
        (월드 사각형 안에 두면 배율·창 크기에 따라 바닥이 사라지는 문제가 생긴다)
      */}
      <div
        className="sand-floor pointer-events-none absolute inset-x-0 bottom-0"
        style={{
          top: Math.max(0, floorScreenY),
          borderRadius: `46% 54% 0 0 / ${16 * zoom}px ${20 * zoom}px 0 0`,
          boxShadow: 'inset 0 8px 12px rgba(255,255,255,.45)',
        }}
      />

      <Bubbles />
    </div>
  );
}
