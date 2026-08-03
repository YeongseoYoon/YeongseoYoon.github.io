import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Icon } from '@/shared/ui';
import { cn } from '@/shared/lib';
import { KIND_META, type Creature, type CreatureKind } from '@/entities/creature';
import { useSession } from '@/entities/session';
import { useDrawing } from '../model/useDrawing';
import { GUIDE_OPTIONS_BY_KIND } from '../model/guideLayout';
import { releaseCreature, saveDraft } from '../model/service';
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
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [showMobileGuides, setShowMobileGuides] = useState(false);

  const isDraftSource = source?.status === 'draft';
  const guideKey = guideByKind[draw.kind];
  const selectedGuide = GUIDE_OPTIONS_BY_KIND[draw.kind].find((option) => option.key === guideKey);

  async function handleRelease() {
    if (!user) return;
    setBusy('release');
    setError(null);
    setNotice(null);
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
    setNotice(null);
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

  const renderActionContent = (desktop: boolean) => (
    <>
      <MiniTankPreview
        sprite={draw.spriteCode}
        kind={draw.kind}
        name={draw.name}
        empty={draw.isEmpty}
        caption="내 수조 미리보기"
        className={desktop ? 'h-32 w-full' : 'h-24 w-full shrink-0'}
      />
      <div className="flex w-full flex-1 flex-col gap-[7px]">
        <Button
          variant="primary"
          className="h-12 w-full rounded-[10px]"
          onClick={handleRelease}
          disabled={busy !== null || draw.isEmpty || !user}
        >
          {busy === 'release' ? '방류 중…' : '방류하기'}
        </Button>
        <span className="text-center text-[11.5px] text-ink-faint">
          바로 바다에 방류돼요 · 신고가 쌓이면 검토해요
        </span>
        <Link to="/guidelines" className="text-center text-[11.5px] font-semibold text-brand-accessible hover:underline">
          방류 전 콘텐츠 가이드 보기
        </Link>
      </div>
    </>
  );

  const renderDetailsFields = (scope: 'desktop' | 'mobile') => (
    <div className="shrink-0 pt-1">
      <label htmlFor={`${scope}-creature-name`} className="mb-1.5 block text-[13px] font-semibold text-ink-sub">
        생물 이름 <span className="font-normal text-ink-faint">(선택)</span>
      </label>
      <div className="mb-3 flex h-11 items-center rounded-lg border border-black/15 bg-white px-3">
        <input
          id={`${scope}-creature-name`}
          value={draw.name}
          onChange={(event) => draw.setName(event.target.value)}
          placeholder="생물 이름을 붙여주세요"
          maxLength={12}
          className="w-full border-none bg-transparent text-[15px] font-semibold outline-none placeholder:text-ink-faint"
        />
      </div>
      <MessageField value={draw.message} onChange={draw.setMessage} />
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
        <section className="min-w-0 shrink-0 px-6 pt-2.5 lg:px-0 lg:pt-0">
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
                  'hidden rounded-full px-2.5 py-1 text-[12px] font-semibold lg:block',
                  showGuide ? 'bg-brand-bg text-brand-accessible' : 'bg-black/[.05] text-ink-sub',
                )}
              >
                {showGuide ? '밑그림 숨기기' : '밑그림 보기'}
              </button>
              <button
                type="button"
                aria-label={`밑그림 변경, 현재 ${showGuide ? selectedGuide?.label : '숨김'}`}
                onClick={() => setShowMobileGuides(true)}
                className="rounded-full bg-brand-bg px-2.5 py-1 text-[12px] font-semibold text-brand-accessible lg:hidden"
              >
                밑그림 · {showGuide ? selectedGuide?.label : '숨김'}
              </button>
            </div>
          </div>
          {showGuide && (
            <div className="hidden lg:block">
              <GuidePicker
                options={GUIDE_OPTIONS_BY_KIND[draw.kind]}
                value={guideKey}
                onChange={(key) => setGuideByKind((current) => ({ ...current, [draw.kind]: key }))}
              />
            </div>
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
            onDraft={handleDraft}
            draftDisabled={busy !== null || draw.isEmpty || !user}
            draftBusy={busy === 'draft'}
          />
          {error && !showMobileDetails && (
            <p className="mb-3 text-[12.5px] text-negative-accessible lg:hidden">{error}</p>
          )}
          {notice && !error && (
            <p className="mb-3 text-[12.5px] font-semibold text-brand-accessible lg:hidden">{notice}</p>
          )}
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
            onDraft={handleDraft}
            draftDisabled={busy !== null || draw.isEmpty || !user}
            draftBusy={busy === 'draft'}
          />
        </section>

        <aside
          data-testid="desktop-details-panel"
          className="hidden min-w-0 shrink-0 flex-col gap-3 px-6 pt-3 lg:flex lg:rounded-[20px] lg:border lg:border-black/[.07] lg:bg-[#fafbfb] lg:p-4"
        >
          {renderDetailsFields('desktop')}
          {error && <p className="m-0 shrink-0 text-[12.5px] text-negative-accessible">{error}</p>}
          {notice && !error && <p className="m-0 shrink-0 text-[12.5px] text-brand-accessible">{notice}</p>}
          <div className="mt-auto flex flex-col items-center gap-3.5 rounded-2xl border border-black/[.07] bg-white p-4 shadow-sm">
            {renderActionContent(true)}
          </div>
        </aside>
      </div>

      <div
        data-testid="mobile-details-trigger"
        className="flex shrink-0 items-center gap-3 border-t border-black/10 bg-white px-6 pt-3 lg:hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 74px)' }}
      >
        <MiniTankPreview
          sprite={draw.spriteCode}
          kind={draw.kind}
          name={draw.name}
          empty={draw.isEmpty}
          caption="내 수조 미리보기"
          className="h-14 w-20 shrink-0"
        />
        <button
          type="button"
          aria-label="다음: 이름과 한마디"
          aria-expanded={showMobileDetails}
          onClick={() => setShowMobileDetails(true)}
          className="flex h-14 flex-1 items-center justify-between rounded-xl bg-brand px-4 text-left text-white shadow-sm"
        >
          <span>
            <span className="block text-[10px] font-semibold text-white/75">그림을 다 그렸다면</span>
            <span className="block text-sm font-bold">다음: 이름과 한마디</span>
          </span>
          <Icon name="chevron-right" size={18} aria-hidden />
        </button>
      </div>

      {showMobileDetails && (
        <div className="absolute inset-0 z-[60] flex items-end bg-black/35 lg:hidden">
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="absolute inset-0"
            onClick={() => setShowMobileDetails(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-details-title"
            className="relative z-10 max-h-[88%] w-full overflow-y-auto rounded-t-3xl bg-white px-6 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-3 shadow-[0_-16px_48px_rgba(4,34,40,.28)]"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/15" />
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="mb-1 text-[11px] font-bold text-brand-accessible">마지막 단계</p>
                <h2 id="mobile-details-title" className="text-lg font-bold text-ink">생물 소개하기</h2>
                <p className="mt-1 text-xs text-ink-faint">이름과 한마디는 선택이에요. 바로 방류해도 괜찮아요.</p>
              </div>
              <button
                type="button"
                aria-label="생물 소개 닫기"
                onClick={() => setShowMobileDetails(false)}
                className="grid h-10 w-10 place-items-center rounded-full bg-black/[.05] text-ink-sub"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            {renderDetailsFields('mobile')}
            {error && <p className="mt-3 text-[12.5px] text-negative-accessible">{error}</p>}
            {notice && !error && <p className="mt-3 text-[12.5px] text-brand-accessible">{notice}</p>}
            <div className="mt-4 flex flex-col items-center gap-3.5 rounded-2xl border border-black/[.07] bg-[#fafbfb] p-4">
              {renderActionContent(false)}
            </div>
          </section>
        </div>
      )}

      {showMobileGuides && (
        <div className="absolute inset-0 z-[60] flex items-end bg-black/35 lg:hidden">
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="absolute inset-0"
            onClick={() => setShowMobileGuides(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-guides-title"
            className="relative z-10 w-full rounded-t-3xl bg-white px-6 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] pt-3 shadow-[0_-16px_48px_rgba(4,34,40,.28)]"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/15" />
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="mb-1 text-[11px] font-bold text-brand-accessible">선택 사항</p>
                <h2 id="mobile-guides-title" className="text-lg font-bold text-ink">밑그림 고르기</h2>
              </div>
              <button
                type="button"
                aria-label="밑그림 선택 닫기"
                onClick={() => setShowMobileGuides(false)}
                className="grid h-10 w-10 place-items-center rounded-full bg-black/[.05] text-ink-sub"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            <GuidePicker
              options={GUIDE_OPTIONS_BY_KIND[draw.kind]}
              value={guideKey}
              onChange={(key) => {
                setGuideByKind((current) => ({ ...current, [draw.kind]: key }));
                setShowGuide(true);
                setShowMobileGuides(false);
              }}
            />
            <button
              type="button"
              onClick={() => {
                setShowGuide(false);
                setShowMobileGuides(false);
              }}
              className="mt-2 h-11 w-full rounded-xl bg-black/[.05] text-sm font-semibold text-ink-sub"
            >
              밑그림 없이 그리기
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
