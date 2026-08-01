const BUBBLES = [
  { bottom: 180, left: 70, size: 9, delay: 0 },
  { bottom: 150, left: 84, size: 6, delay: 2 },
  { bottom: 220, right: 110, size: 8, delay: 1 },
];

/** 상승하는 기포. 위치는 고정 시드값으로 산개. */
export function Bubbles() {
  return (
    <>
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="absolute animate-bubbleRise rounded-full border-[1.5px] border-white/75"
          style={{
            bottom: b.bottom,
            left: b.left,
            right: b.right,
            width: b.size,
            height: b.size,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </>
  );
}
