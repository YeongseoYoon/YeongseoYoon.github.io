import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * 오픈월드 카메라.
 *
 * 이전 설계는 "월드는 유한한 사각형이고 항상 화면을 덮어야 한다"는 제약을 뒀는데,
 * 브라우저 배율/창 크기가 바뀌면 이 제약이 계속 깨져 바닥이 사라지거나 빈 물이 보였다.
 *
 * 지금은 제약을 없앴다:
 * - 바다는 **가로로 무한**하다. 콘텐츠가 있는 범위만 부드럽게 가둔다.
 * - 바닥은 월드 사각형이 아니라 **화면 공간 레이어**로 그린다(AquariumMap).
 *   → 화면 크기·배율이 어떻든 바닥은 항상 그려진다.
 * - 세로는 "바닥선이 화면 안에 머무는" 범위로만 이동할 수 있다.
 */
export interface Viewport {
  zoom: number;
  pan: { x: number; y: number };
  size: { w: number; h: number };
  minZoom: number;
  maxZoom: number;
  /** 바닥선의 화면 y 좌표 — 바닥 레이어를 그리는 기준 */
  floorScreenY: number;
  didDrag: () => boolean;
  bind: {
    ref: (el: HTMLDivElement | null) => void;
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onWheel: (e: React.WheelEvent) => void;
  };
  zoomIn: () => void;
  zoomOut: () => void;
  focusOn: (worldX: number, worldY?: number, targetZoom?: number) => void;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** 절대 하한/상한 (안전장치) */
const ABS_MIN_ZOOM = 0.28;
const ABS_MAX_ZOOM = 2.4;
/** 모래 바닥 띠 높이 (화면 비율, 상한 있음) — 땅이 화면을 잡아먹지 않도록 */
const GROUND_RATIO = 0.085;
const GROUND_MAX_PX = 88;
/** 콘텐츠 좌우 여유 (월드 밖으로 조금 더 나갈 수 있게) */
const EDGE_MARGIN = 400;

interface Options {
  /** 콘텐츠(생물)가 차지한 가로 범위 */
  contentWidth: number;
  /** 콘텐츠(생물)가 차지한 세로 범위 */
  contentHeight: number;
  /** 바닥선의 월드 y */
  floorY: number;
}

export function useMapViewport({ contentWidth, contentHeight, floorY }: Options): Viewport {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const elRef = useRef<HTMLDivElement | null>(null);
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  zoomRef.current = zoom;
  panRef.current = pan;

  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchDist = useRef<number | null>(null);
  const dragMoved = useRef(0);
  const inited = useRef(false);

  /**
   * 팬 제한.
   * - 가로: 콘텐츠 범위 ± 여유. 콘텐츠가 화면보다 좁으면 가운데.
   * - 세로: 바닥선이 화면 안(42%~100%)에 머물도록. → 바닥은 절대 사라지지 않는다.
   */
  /** 모래 띠 높이 — 화면 비율 기반, 상한 있음. */
  const groundBand = Math.min(GROUND_MAX_PX, size.h * GROUND_RATIO);

  /**
   * 최소 줌 = "생물이 차지한 영역이 화면을 채우는 배율".
   *
   * 고정값으로 두면 큰 화면(브라우저 축소 등)에서 생물이 화면 한구석에만
   * 옹기종기 모여 보이고 나머지는 빈 물이 된다. 화면이 커질수록 하한을 같이 올려
   * **빈 물로 줌아웃하는 것 자체를 막는다**. (생물이 늘어 월드가 넓어지면 하한은 자연히 내려간다)
   */
  const minZoom = size.w && size.h
    ? clamp(
        Math.max(
          size.w / (contentWidth + EDGE_MARGIN),
          (size.h - groundBand) / (contentHeight * 1.12),
        ),
        ABS_MIN_ZOOM,
        ABS_MAX_ZOOM,
      )
    : ABS_MIN_ZOOM;
  const maxZoom = Math.max(minZoom * 2.6, 1.8);

  /**
   * 세로는 **고정**한다. 바닥선이 항상 화면 하단에서 groundBand 위에 오도록 계산만 한다.
   * (세로로도 끌 수 있게 하면 땅이 화면 절반을 덮거나 반대로 사라지는 문제가 생긴다.
   *  이 세계관은 "옆으로 넓어지는 바다"이므로 가로 이동만으로 충분하다.)
   */
  const clampPan = useCallback(
    (p: { x: number; y: number }, z: number) => {
      const contentPx = (contentWidth + EDGE_MARGIN * 2) * z;
      const x =
        contentPx <= size.w
          ? (size.w - contentPx) / 2 + EDGE_MARGIN * z
          : clamp(p.x, size.w - contentPx + EDGE_MARGIN * z, EDGE_MARGIN * z);
      return { x, y: size.h - groundBand - floorY * z };
    },
    [contentWidth, floorY, size.w, size.h, groundBand],
  );

  const ref = useCallback((el: HTMLDivElement | null) => {
    elRef.current = el;
    if (el) setSize({ w: el.clientWidth, h: el.clientHeight });
  }, []);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });

    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }
    // 브라우저 배율 변경은 ResizeObserver를 못 태우는 경우가 있어 보강한다.
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    measure();

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
    };
  }, []);

  // 최초: 바닥이 화면 하단에 오도록 맞춘다.
  useLayoutEffect(() => {
    if (inited.current || !size.w || !size.h) return;
    inited.current = true;
    const z = clamp(minZoom * 1.15, minZoom, maxZoom);
    setZoom(z);
    setPan(clampPan({ x: 0, y: 0 }, z));
  }, [size.w, size.h, floorY, minZoom, maxZoom, clampPan]);

  // 크기/배율이 바뀌면 팬을 다시 가둔다(바닥이 화면 밖으로 밀리지 않도록).
  useEffect(() => {
    if (!inited.current || !size.w || !size.h) return;
    const z = clamp(zoomRef.current, minZoom, maxZoom);
    const next = clampPan(panRef.current, z);
    if (z !== zoomRef.current) setZoom(z);
    if (next.x !== panRef.current.x || next.y !== panRef.current.y) setPan(next);
  }, [size.w, size.h, minZoom, maxZoom, clampPan]);

  /** (cx,cy) 화면점 아래의 월드 지점을 유지하며 줌 변경. */
  const applyZoom = useCallback(
    (nextZoom: number, cx: number, cy: number) => {
      const z = clamp(nextZoom, minZoom, maxZoom);
      const pz = zoomRef.current;
      const pp = panRef.current;
      const wx = (cx - pp.x) / pz;
      const wy = (cy - pp.y) / pz;
      setZoom(z);
      setPan(clampPan({ x: cx - wx * z, y: cy - wy * z }, z));
    },
    [clampPan, minZoom, maxZoom],
  );

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragMoved.current = 0;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchDist.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;
      const prev = pointers.current.get(e.pointerId)!;
      const cur = { x: e.clientX, y: e.clientY };
      pointers.current.set(e.pointerId, cur);

      if (pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist.current) {
          const rect = elRef.current?.getBoundingClientRect();
          applyZoom(
            zoomRef.current * (dist / pinchDist.current),
            (a.x + b.x) / 2 - (rect?.left ?? 0),
            (a.y + b.y) / 2 - (rect?.top ?? 0),
          );
        }
        pinchDist.current = dist;
        dragMoved.current += 10;
        return;
      }

      const dx = cur.x - prev.x;
      dragMoved.current += Math.abs(dx) + Math.abs(cur.y - prev.y);
      setPan(clampPan({ x: panRef.current.x + dx, y: 0 }, zoomRef.current));
    },
    [clampPan, applyZoom],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchDist.current = null;
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      const rect = elRef.current?.getBoundingClientRect();
      applyZoom(
        zoomRef.current * (e.deltaY < 0 ? 1.12 : 1 / 1.12),
        e.clientX - (rect?.left ?? 0),
        e.clientY - (rect?.top ?? 0),
      );
    },
    [applyZoom],
  );

  const zoomIn = useCallback(
    () => applyZoom(zoomRef.current * 1.35, size.w / 2, size.h / 2),
    [applyZoom, size.w, size.h],
  );
  const zoomOut = useCallback(
    () => applyZoom(zoomRef.current / 1.35, size.w / 2, size.h / 2),
    [applyZoom, size.w, size.h],
  );

  const focusOn = useCallback(
    (worldX: number, _worldY?: number, targetZoom = maxZoom) => {
      const z = clamp(targetZoom, minZoom, maxZoom);
      setZoom(z);
      setPan(clampPan({ x: size.w / 2 - worldX * z, y: 0 }, z));
    },
    [size.w, size.h, clampPan, minZoom, maxZoom],
  );

  return {
    zoom,
    pan,
    size,
    minZoom,
    maxZoom,
    floorScreenY: pan.y + floorY * zoom,
    didDrag: useCallback(() => dragMoved.current > 8, []),
    bind: { ref, onPointerDown, onPointerMove, onPointerUp, onWheel },
    zoomIn,
    zoomOut,
    focusOn,
  };
}
