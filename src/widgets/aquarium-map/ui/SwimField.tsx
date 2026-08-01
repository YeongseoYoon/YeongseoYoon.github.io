import { useEffect, useRef } from 'react';
import { mulberry32 } from '@/shared/lib';
import { CreatureSprite, FLOOR_Y, WANDER_RADIUS, WATER_TOP, type Creature } from '@/entities/creature';
import type { WorldCreature } from '../model/world';

interface SwimFieldProps {
  /** 화면에 보이는 생물만 (컬링된 목록) */
  visible: WorldCreature[];
  onSelect: (creature: Creature) => void;
  didDrag: () => boolean;
  /** 넓게 볼 때 그림자 등 비용 큰 효과를 끈다 */
  lowDetail: boolean;
}

/** 헤엄 상태 — 저장하지 않는 클라이언트 연출. 앵커 주변만 배회한다. */
interface SwimState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  flip: number;
  el: HTMLDivElement | null;
  box: HTMLDivElement | null;
}

const prefersReduced =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * 헤엄 연출 + 렌더.
 *
 * 성능 설계:
 * - **보이는 생물만 DOM에 올린다**(컬링). 화면 밖은 언마운트되고 RAF 대상에서도 빠진다.
 * - 위치는 JSX가 아니라 RAF가 transform으로 직접 쓴다 → 팬/줌 리렌더가 물고기를 되돌리지 않음.
 * - 헤엄 상태는 id별로 ref에 보존 → 화면 밖으로 나갔다 돌아와도 이어서 헤엄친다.
 */
export function SwimField({ visible, onSelect, didDrag, lowDetail }: SwimFieldProps) {
  const states = useRef<Map<string, SwimState>>(new Map());
  const visibleRef = useRef<WorldCreature[]>(visible);
  visibleRef.current = visible;

  /** 앵커 기준 초기 상태 (처음 보이는 순간 생성). */
  function stateFor(p: WorldCreature): SwimState {
    const existing = states.current.get(p.creature.id);
    if (existing) return existing;
    const rnd = mulberry32(p.x * 7919 + p.y);
    const speed = 12 + rnd() * 20;
    const angle = rnd() * Math.PI * 2;
    const created: SwimState = {
      x: p.x,
      y: p.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 0.35,
      flip: p.flip ? -1 : 1,
      el: null,
      box: null,
    };
    states.current.set(p.creature.id, created);
    return created;
  }

  useEffect(() => {
    if (prefersReduced) return;
    let raf = 0;
    let last = performance.now();

    const step = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;

      for (const p of visibleRef.current) {
        if (p.anchored) continue;
        const s = states.current.get(p.creature.id);
        if (!s?.el) continue;

        if (Math.random() < 0.02) {
          s.vx += (Math.random() - 0.5) * 7;
          s.vy += (Math.random() - 0.5) * 4;
        }
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        // 앵커 주변 반경 안에서만 돈다 → "내 생물은 늘 그 근처"
        if (s.x < p.x - WANDER_RADIUS) s.vx = Math.abs(s.vx);
        else if (s.x > p.x + WANDER_RADIUS) s.vx = -Math.abs(s.vx);
        if (s.y < Math.max(WATER_TOP, p.y - WANDER_RADIUS)) s.vy = Math.abs(s.vy);
        else if (s.y > Math.min(FLOOR_Y - p.h - 10, p.y + WANDER_RADIUS)) s.vy = -Math.abs(s.vy);

        const want = s.vx < 0 ? -1 : 1;
        if (want !== s.flip) {
          s.flip = want;
          if (s.box) s.box.style.transform = `scaleX(${s.flip})`;
        }
        s.el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      {visible.map((p) => {
        const s = stateFor(p);
        return (
          <div
            key={p.creature.id}
            ref={(el) => {
              s.el = el;
              if (el) el.style.transform = `translate3d(${p.anchored ? p.x : s.x}px, ${p.anchored ? p.y : s.y}px, 0)`;
            }}
            className="absolute left-0 top-0 will-change-transform"
          >
            {p.creature.message && (
              <div className="msg-label absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap">
                <span className="rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-semibold text-sea-deep shadow-[0_2px_8px_rgba(9,62,70,.18)] backdrop-blur">
                  {p.creature.message}
                </span>
              </div>
            )}
            <button
              onClick={() => {
                if (!didDrag()) onSelect(p.creature);
              }}
              aria-label={`${p.creature.name} 보기`}
              className="block"
            >
              <div
                ref={(el) => {
                  s.box = el;
                  if (el) el.style.transform = `scaleX(${s.flip})`;
                }}
              >
                <CreatureSprite
                  creature={p.creature}
                  width={p.w}
                  height={p.h}
                  animate={p.anchored}
                  flip={false}
                  shadow={!lowDetail}
                />
              </div>
            </button>
          </div>
        );
      })}
    </>
  );
}
