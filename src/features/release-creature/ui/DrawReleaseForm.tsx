import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui';
import { cn, useAsync } from '@/shared/lib';
import { KIND_META, type Creature, type CreatureKind } from '@/entities/creature';
import { useSession } from '@/entities/session';
import { useDrawing } from '../model/useDrawing';
import { GUIDE_OPTIONS_BY_KIND } from '../model/guideLayout';
import { releaseCreature, saveDraft } from '../model/service';
import { getReleaseQuota } from '../model/quota';
import { KindTabs } from './KindTabs';
import { PixelCanvas } from './PixelCanvas';
import { DrawingControls } from './DrawingControls';
import { MessageField } from './MessageField';
import { MiniTankPreview } from './MiniTankPreview';
import { GuidePicker } from './GuidePicker';

interface DrawReleaseFormProps {
  /** 이어 그릴 원본 (반려·숨김 후 재작업, 임시저장 복구) */
  source?: Creature | null;
  onReleased: (creature: Creature) => void;
  onDraftSaved?: () => void;
}

const DEFAULT_GUIDE_BY_KIND: Record<CreatureKind, string> = {
  fish: GUIDE_OPTIONS_BY_KIND.fish[0].key,
  seaweed: GUIDE_OPTIONS_BY_KIND.seaweed[0].key,
  decoration: GUIDE_OPTIONS_BY_KIND.decoration[0].key,
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
  const [guideByKind, setGuideByKind] = useState(DEFAULT_GUIDE_BY_KIND);
  const [busy, setBusy] = useState<'release' | 'draft' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const quota = useAsync(
    () => (user ? getReleaseQuota(user.id) : Promise.resolve(null)),
    [user?.id],
  );

  const isDraftSource = source?.status === 'draft';
  const guideKey = guideByKind[draw.kind];

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

  const renderActions = (desktop: boolean) => (
    <div
      className={cn(
        'items-center gap-3.5',
        desktop
          ? 'hidden rounded-2xl border border-black/[.07] bg-white p-4 shadow-sm lg:flex lg:flex-col'
          : 'flex shrink-0 border-t border-black/10 px-6 pt-3.5 lg:hidden',
      )}
      style={desktop ? undefined : { paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 74px)' }}
    >
      <MiniTankPreview
        sprite={draw.spriteCode}
        kind={draw.kind}
        name={draw.name}
        empty={draw.isEmpty}
        caption="내 수조 미리보기"
        className={desktop ? 'h-32 w-full' : 'h-16 w-24 shrink-0'}
      />
      <div className="flex w-full flex-1 flex-col gap-[7px]">
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
        <Link to="/guidelines" className="text-center text-[11.5px] font-semibold text-brand-accessible hover:underline">
          방류 전 콘텐츠 가이드 보기
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 justify-center px-6 lg:pb-4">
        <div className="w-full lg:max-w-3xl">
          <KindTabs kind={draw.kind} onChange={draw.setKind} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-3 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(340px,2fr)] lg:gap-6 lg:px-6 lg:pb-20">
        <section className="min-w-0 shrink-0 px-6 pt-4 lg:px-0 lg:pt-0">
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
                {showGuide ? '밑그림 숨기기' : '밑그림 보기'}
              </button>
            </div>
          </div>
          {showGuide && (
            <GuidePicker
              options={GUIDE_OPTIONS_BY_KIND[draw.kind]}
              value={guideKey}
              onChange={(key) => setGuideByKind((current) => ({ ...current, [draw.kind]: key }))}
            />
          )}
          <DrawingControls
            variant="mobile"
            tool={draw.tool}
            brush={draw.brush}
            color={draw.color}
            onBrush={draw.setBrush}
            onTool={draw.setTool}
            onColor={draw.setColor}
            canUndo={draw.canUndo}
            canRedo={draw.canRedo}
            onUndo={draw.undo}
            onRedo={draw.redo}
          />
          <PixelCanvas
            pixels={draw.pixels}
            onPaintCell={draw.paintCell}
            onStrokeStart={draw.beginStroke}
            hint={KIND_META[draw.kind].label + '는 이렇게 움직여요'}
            guideSpriteKey={showGuide ? guideKey : null}
          />
          <DrawingControls
            variant="desktop"
            tool={draw.tool}
            brush={draw.brush}
            color={draw.color}
            onBrush={draw.setBrush}
            onTool={draw.setTool}
            onColor={draw.setColor}
            canUndo={draw.canUndo}
            canRedo={draw.canRedo}
            onUndo={draw.undo}
            onRedo={draw.redo}
          />
        </section>

        <aside className="flex min-w-0 shrink-0 flex-col gap-3 px-6 pt-3 lg:rounded-[20px] lg:border lg:border-black/[.07] lg:bg-[#fafbfb] lg:p-4">
          <div className="shrink-0 pt-1">
            <div className="mb-2 flex h-10 items-center rounded-lg border border-black/15 bg-white px-3">
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
          {error && <p className="m-0 shrink-0 text-[12.5px] text-negative-accessible">{error}</p>}
          {notice && !error && <p className="m-0 shrink-0 text-[12.5px] text-brand-accessible">{notice}</p>}
          <div className="mt-auto pt-1">{renderActions(true)}</div>
        </aside>
      </div>

      {renderActions(false)}
    </div>
  );
}
