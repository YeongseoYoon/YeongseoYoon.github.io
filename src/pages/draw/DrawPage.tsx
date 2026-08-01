import { useNavigate, useSearchParams } from 'react-router-dom';
import { Screen, ScreenHeader } from '@/shared/ui';
import { useAsync } from '@/shared/lib';
import { creatureApi, type Creature } from '@/entities/creature';
import { DrawReleaseForm } from '@/features/release-creature';

/**
 * 생물 그리기 (PRD 7.1).
 * `?edit=<id>` 로 들어오면 기존 그림을 불러와 이어 그린다
 * (반려·숨김 후 재작업, 임시저장 복구).
 */
export function DrawPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('edit');

  const { data: source, loading } = useAsync(
    () => (editId ? creatureApi.get(editId) : Promise.resolve<Creature | null>(null)),
    [editId],
  );

  return (
    <Screen variant="content" className="flex flex-col bg-white">
      <div className="h-3 shrink-0" />
      <ScreenHeader
        title={editId ? '생물 다시 그리기' : '생물 그리기'}
        onBack={() => navigate(-1)}
      />
      {editId && loading ? (
        <div className="grid flex-1 place-items-center text-sm text-ink-faint">불러오는 중…</div>
      ) : (
        <DrawReleaseForm
          key={source?.id ?? 'new'}
          source={source}
          onReleased={() => navigate('/my-tank')}
          onDraftSaved={() => undefined}
        />
      )}
    </Screen>
  );
}
