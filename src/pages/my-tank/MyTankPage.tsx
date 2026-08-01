import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Screen, ScreenHeader } from '@/shared/ui';
import { useAsync } from '@/shared/lib';
import { isSupabaseMode, subscribeToServerChanges } from '@/shared/api';
import { creatureApi, type Creature } from '@/entities/creature';
import { useSession } from '@/entities/session';
import { getReleaseQuota } from '@/features/release-creature';
import { ShareTankSheet } from '@/features/share-creature';
import { MyCreatureList, MyTankPreview, ReleaseQuotaBar } from '@/widgets/my-tank';

/** 내 수조 (PRD 7·10). 내 생물·방류 상태 확인, 반려 사유 확인 후 재제출. */
export function MyTankPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [sharing, setSharing] = useState(false);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const { data: creatures, refetch } = useAsync(
    () => (user ? creatureApi.listByAuthor(user.id) : Promise.resolve<Creature[]>([])),
    [user?.id],
  );
  const { data: quota, refetch: refetchQuota } = useAsync(
    () => (user ? getReleaseQuota(user.id) : Promise.resolve(null)),
    [user?.id],
  );

  useEffect(() => {
    if (!isSupabaseMode) return;
    return subscribeToServerChanges(['creatures'], () => {
      refetch();
      refetchQuota();
    });
  }, [refetch, refetchQuota]);

  const sorted = useMemo(
    () => [...(creatures ?? [])]
      .filter((creature) => creature.status !== 'deleted' && !deletedIds.has(creature.id))
      .sort((a, b) => b.createdAt - a.createdAt),
    [creatures, deletedIds],
  );
  const publicCreatures = useMemo(
    () => sorted.filter((creature) => creature.status === 'published'),
    [sorted],
  );

  return (
    <Screen variant="wide" className="flex flex-col bg-white">
      <div className="h-3 shrink-0" />
      <ScreenHeader
        title="내 수조"
        onBack={() => navigate('/')}
        action={
          <button
            className="flex items-center gap-1 rounded-full bg-brand-bg px-2.5 py-1.5 text-[12px] font-semibold text-brand-accessible"
            aria-label="내 수족관 공유하기"
            onClick={() => setSharing(true)}
          >
            <Icon name="share" size={15} /> 공유
          </button>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(360px,2fr)] lg:gap-6 lg:px-6 lg:pb-20">
        <section className="shrink-0 lg:min-w-0">
          <MyTankPreview
            creatures={sorted}
            className="lg:mx-0 lg:mt-1.5 lg:aspect-[16/9] lg:max-h-[420px]"
          />
          {quota && <ReleaseQuotaBar quota={quota} className="lg:mx-0" />}
        </section>

        <MyCreatureList
          creatures={sorted}
          onChanged={refetch}
          onDeleted={(id) => setDeletedIds((current) => new Set(current).add(id))}
          className="lg:mx-0 lg:mt-1.5 lg:rounded-[20px] lg:border lg:border-black/[.07] lg:bg-[#fafbfb] lg:px-4 lg:pt-4"
        />
      </div>

      {sharing && user && (
        <ShareTankSheet
          authorId={user.id}
          ownerName={user.nickname ?? '나'}
          creatures={publicCreatures}
          onClose={() => setSharing(false)}
        />
      )}
    </Screen>
  );
}
