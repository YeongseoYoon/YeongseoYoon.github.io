/** 수면에서 내려오는 빛기둥 연출. 순수 장식 레이어. */
export function LightBeams() {
  return (
    <>
      <div
        className="absolute inset-x-0 top-0 h-14 opacity-50 blur-[3px]"
        style={{
          background:
            'repeating-linear-gradient(100deg,rgba(255,255,255,.55) 0 14px,rgba(255,255,255,0) 14px 46px)',
        }}
      />
      <div
        className="absolute -top-10 left-9 h-[560px] w-[74px] blur-md"
        style={{
          background: 'linear-gradient(180deg,rgba(255,255,255,.5),rgba(255,255,255,0) 80%)',
          transform: 'skewX(-14deg)',
        }}
      />
      <div
        className="absolute -top-10 right-11 h-[520px] w-[60px] blur-md"
        style={{
          background: 'linear-gradient(180deg,rgba(255,255,255,.32),rgba(255,255,255,0) 78%)',
          transform: 'skewX(-12deg)',
        }}
      />
    </>
  );
}
