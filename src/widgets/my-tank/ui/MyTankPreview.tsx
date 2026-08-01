import { CreatureSprite, spriteBaseSize, type Creature } from '@/entities/creature';
import { SandFloor } from '@/shared/ui';

/** 미리보기 수조 안의 상대 위치(%) — 화면 폭이 변해도 비율로 유지된다. */
const SPOTS = [
  { left: '12%', top: '28%' },
  { left: '58%', top: '52%' },
  { left: '34%', top: '68%' },
  { left: '68%', top: '22%' },
];

/** 내 수조 미리보기 — 내 공개/대기 생물이 함께 헤엄친다. */
export function MyTankPreview({ creatures }: { creatures: Creature[] }) {
  const swimmers = creatures
    .filter((c) => c.status === 'published' || c.status === 'pending')
    .slice(0, SPOTS.length);

  return (
    <div className="water-tank relative mx-5 mt-1.5 aspect-[16/10] max-h-[280px] min-h-[170px] shrink-0 overflow-hidden rounded-[20px]">
      <div
        className="absolute -top-5 left-10 h-[240px] w-[50px] blur-[5px]"
        style={{
          background: 'linear-gradient(180deg,rgba(255,255,255,.45),rgba(255,255,255,0) 80%)',
          transform: 'skewX(-14deg)',
        }}
      />
      <SandFloor height={44} className="-inset-x-2.5" />
      <img
        src="/assets/kelp.png"
        width={33}
        height={55}
        className="pixel absolute bottom-[30px] right-5 origin-bottom animate-weedSway"
        alt=""
      />

      {swimmers.map((c, i) => {
        const [w, h] = spriteBaseSize(c.spriteKey);
        return (
          <div key={c.id} className="absolute" style={SPOTS[i]}>
            <CreatureSprite
              creature={c}
              width={w * 5}
              height={h * 5}
              flip={i % 2 === 1}
              delay={i * 0.4}
            />
          </div>
        );
      })}

      <span className="absolute left-3 top-3 rounded-full bg-white/75 px-2.5 py-[5px] text-[11.5px] font-bold text-sea-deep backdrop-blur">
        내 생물 {swimmers.length}
      </span>
    </div>
  );
}
