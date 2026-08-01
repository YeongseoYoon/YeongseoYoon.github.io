import { useState } from 'react';
import { Button } from '@/shared/ui';
import { cn, useAsync } from '@/shared/lib';
import { KIND_META, type Creature, type CreatureKind } from '@/entities/creature';
import { useSession } from '@/entities/session';
import { useDrawing } from '../model/useDrawing';
import { releaseCreature, saveDraft } from '../model/service';
import { getReleaseQuota } from '../model/quota';
import { KindTabs } from './KindTabs';
import { PixelCanvas } from './PixelCanvas';
import { DrawToolbar } from './DrawToolbar';
import { Palette } from './Palette';
import { MessageField } from './MessageField';
import { MiniTankPreview } from './MiniTankPreview';

interface DrawReleaseFormProps {
  /** 이어 그릴 원본 (반려·숨김 후 재작업, 임시저장 복구) */
  source?: Creature | null;
  onReleased: (creature: Creature) => void;
  onDraftSaved?: () => void;
}

/** 종류별 참고 밑그림 (따라 그리기용). */
const GUIDE_BY_KIND: Record<CreatureKind, string> = {
  fish: 'clownfish',
  seaweed: 'weed',
  decoration: 'star',
};

/** "생물 그리기" 화면 본문 (PRD 7.1). 상태(useDrawing) + 유스케이스 조립. */
export function DrawReleaseForm({ source, onReleased, onDraftSaved }: DrawReleaseFormProps) {
  const { user } = useSession();
  const draw = useDrawing({
    kind: source?.kind,
    name: source?.name,
    message: source?.message,
    sprite: source?.sprite,
  });
  const [showGuide, setShowGuide] = useState(true);
  const [busy, setBusy] = useState<'release' | 'draft' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const quota = useAsync(
    () => (user ? getReleaseQuota(user.id) : Promise.resolve(null)),
    [user?.id],
  );

  const isDraftSource = source?.status === 'draft';

  async function handleRelease() {
    if (!user) return;
    setBusy('release');
    setError(null);
    try {
      const creature = await releaseCreature({
        kind: draw.kind,
        name: draw.name,
        message: draw.message,
        sprite: draw.spriteCode,
        authorId: user.id,
        authorNickname: user.nickname,
        fromDraftId: isDraftSource ? source.id : null,
      });
      onReleased(creature);
    } catch (e) {
      setError(e instanceof Error ? e.message : '방류에 실패했어요.');
      setBusy(null);
    }
  }

  async function handleDraft() {
    if (!user) return;
    setBusy('draft');
    setError(null);
    try {
      await saveDraft({
        kind: draw.kind,
        name: draw.name,
        message: draw.message,
        sprite: draw.spriteCode,
        authorId: user.id,
        authorNickname: user.nickname,
        draftId: isDraftSource ? source.id : null,
      });
      setNotice('임시저장했어요. 내 수조에서 이어 그릴 수 있어요.');
      onDraftSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : '임시저장에 실패했어요.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-3">
        <div className="flex shrink-0 justify-center px-6">
          <KindTabs kind={draw.kind} onChange={draw.setKind} />
        </div>

        <div className="shrink-0 px-6 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ink-sub">
              {KIND_META[draw.kind].label} 그리기
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={draw.clear}
                className="rounded-full bg-black/[.05] px-2.5 py-1 text-[12px] font-semibold text-ink-sub"
              >
                전체 지우기
              </button>
              <button
                type="button"
                onClick={() => setShowGuide((v) => !v)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-[12px] font-semibold',
                  showGuide ? 'bg-brand-bg text-brand-accessible' : 'bg-black/[.05] text-ink-sub',
                )}
              >
                밑그림 {showGuide ? '켜짐' : '꺼짐'}
              </button>
            </div>
          </div>
          <PixelCanvas
            pixels={draw.pixels}
            onPaintCell={draw.paintCell}
            onStrokeStart={draw.beginStroke}
            hint={KIND_META[draw.kind].label + '는 이렇게 움직여요'}
            guideSpriteKey={showGuide ? GUIDE_BY_KIND[draw.kind] : null}
          />
        </div>

        <div className="shrink-0 px-6 pt-3">
          <DrawToolbar
            tool={draw.tool}
            brush={draw.brush}
            onBrush={draw.setBrush}
            onTool={draw.setTool}
            canUndo={draw.canUndo}
            canRedo={draw.canRedo}
            onUndo={draw.undo}
            onRedo={draw.redo}
          />
        </div>

        <div className="shrink-0 px-6 pt-3">
          <Palette color={draw.color} onSelect={draw.setColor} />
        </div>

        <div className="shrink-0 px-6 pt-4">
          <div className="mb-2 flex h-10 items-center rounded-lg border border-black/15 px-3">
            <input
              value={draw.name}
              onChange={(e) => draw.setName(e.target.value)}
              placeholder="생물 이름"
              maxLength={12}
              className="w-full border-none bg-transparent text-[15px] font-semibold outline-none placeholder:text-ink-faint"
            />
          </div>
          <MessageField value={draw.message} onChange={draw.setMessage} />
        </div>

        {error && <p className="shrink-0 px-6 pt-2 text-[12.5px] text-negative-accessible">{error}</p>}
        {notice && !error && (
          <p className="shrink-0 px-6 pt-2 text-[12.5px] text-brand-accessible">{notice}</p>
        )}
      </div>

      <div
        className="flex shrink-0 items-center gap-3.5 border-t border-black/10 px-6 pt-3.5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 74px)' }}
      >
        <MiniTankPreview
          sprite={draw.spriteCode}
          kind={draw.kind}
          name={draw.name}
          empty={draw.isEmpty}
          caption="내 수조 미리보기"
          className="h-16 w-24 shrink-0"
        />
        <div className="flex flex-1 flex-col gap-[7px]">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="h-12 rounded-[10px] px-4"
              onClick={handleDraft}
              disabled={busy !== null || draw.isEmpty || !user}
            >
              {busy === 'draft' ? '저장 중…' : '임시저장'}
            </Button>
            <Button
              variant="primary"
              className="h-12 flex-1 rounded-[10px]"
              onClick={handleRelease}
              disabled={busy !== null || draw.isEmpty || !user}
            >
              {busy === 'release' ? '방류 중…' : '방류하기'}
            </Button>
          </div>
          <span className="text-center text-[11.5px] text-ink-faint">
            바로 바다에 방류돼요 · 신고가 쌓이면 검토해요
            {quota.data ? ` · 오늘 ${quota.data.remaining}회 남음` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
