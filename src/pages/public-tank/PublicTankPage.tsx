import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { creatureApi, CreatureSprite, spriteBaseSize, type Creature } from '@/entities/creature';
import { useAsync } from '@/shared/lib';
import { Button, Screen, ScreenHeader } from '@/shared/ui';
import { MyTankPreview } from '@/widgets/my-tank';

/** 공유 링크로 여는 읽기 전용 수족관. 공개 중인 생물만 노출한다. */
export function PublicTankPage() {
  const navigate = useNavigate();
  const { authorId = '' } = useParams();
  const { data, loading, error } = useAsync(
    () => authorId ? creatureApi.listByAuthor(authorId) : Promise.resolve<Creature[]>([]),
    [authorId],
  );
  const creatures = useMemo(
    () => (data ?? []).filter((creature) => creature.status === 'published'),
    [data],
  );
  const ownerName = creatures[0]?.authorNickname ?? '이름 없는 탐험가';

  return (
    <Screen variant="content" className="flex flex-col bg-white">
      <div className="h-3 shrink-0" />
      <ScreenHeader title={`${ownerName}의 수족관`} onBack={() => navigate('/')} />

      {loading ? (
        <p className="px-6 py-16 text-center text-sm text-ink-faint">수족관을 불러오는 중…</p>
      ) : error ? (
        <p className="px-6 py-16 text-center text-sm text-negative-accessible">수족관을 불러오지 못했어요.</p>
      ) : (
        <>
          <MyTankPreview creatures={creatures} countLabel="공개 생물" />
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-28 pt-5">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h2 className="m-0 text-lg font-bold">여기 사는 생물들</h2>
                <p className="mb-0 mt-1 text-[12.5px] text-ink-faint">공개 중인 생물 {creatures.length}마리</p>
              </div>
            </div>
            {creatures.length === 0 && (
              <p className="rounded-2xl bg-black/[.035] py-10 text-center text-[13px] text-ink-faint">
                아직 공개된 생물이 없어요.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {creatures.map((creature) => {
                const [w, h] = spriteBaseSize(creature.spriteKey);
                return (
                  <div key={creature.id} className="flex min-h-28 flex-col items-center justify-center rounded-2xl bg-brand-bg/70 px-3 py-4">
                    <CreatureSprite creature={creature} width={w * 4} height={h * 4} shadow={false} />
                    <strong className="mt-2 text-[13px] text-sea-deep">{creature.name}</strong>
                    {creature.message && <span className="mt-0.5 line-clamp-1 text-[11px] text-sea-mid">“{creature.message}”</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div className="absolute inset-x-5 bottom-5 z-10 flex justify-center">
        <Button variant="primary" size="pill" className="shadow-lg" onClick={() => navigate('/draw')}>
          + 나도 생물 그리기
        </Button>
      </div>
    </Screen>
  );
}
