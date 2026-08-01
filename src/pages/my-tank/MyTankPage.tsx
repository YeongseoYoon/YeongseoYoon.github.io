import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Screen, ScreenHeader } from '@/shared/ui';
import { useAsync } from '@/shared/lib';
import { creatureApi, type Creature } from '@/entities/creature';
import { useSession } from '@/entities/session';
import { getReleaseQuota } from '@/features/release-creature';
import { MyCreatureList, MyTankPreview, ReleaseQuotaBar } from '@/widgets/my-tank';

/** 내 수조 (PRD 7·10). 내 생물·방류 상태 확인, 반려 사유 확인 후 재제출. */
export function MyTankPage() {
  const navigate = useNavigate();
  const { user } = useSession();

  const { data: creatures, refetch } = useAsync(
    () => (user ? creatureApi.listByAuthor(user.id) : Promise.resolve<Creature[]>([])),
    [user?.id],
  );
  const { data: quota } = useAsync(
    () => (user ? getReleaseQuota(user.id) : Promise.resolve(null)),
    [user?.id],
  );

  const sorted = useMemo(
    () => [...(creatures ?? [])].sort((a, b) => b.createdAt - a.createdAt),
    [creatures],
  );

  return (
    <Screen variant="content" className="flex flex-col bg-white">
      <div className="h-3 shrink-0" />
      <ScreenHeader
        title="내 수조"
        onBack={() => navigate('/')}
        action={
          <button className="p-2 text-ink-sub" aria-label="설정">
            <Icon name="settings" size={19} />
          </button>
        }
      />

      <MyTankPreview creatures={sorted} />
      {quota && <ReleaseQuotaBar quota={quota} />}
      <MyCreatureList creatures={sorted} onChanged={refetch} />
    </Screen>
  );
}
