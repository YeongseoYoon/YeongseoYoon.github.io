import { Button, Icon } from '@/shared/ui';
import { formatRelativeTime } from '@/shared/lib';
import {
  CreatureSprite,
  KindBadge,
  spriteBaseSize,
  type Creature,
} from '@/entities/creature';
import { displayName } from '@/entities/user';

interface CreatureDetailSheetProps {
  creature: Creature;
  onClose: () => void;
  onReport: () => void;
  onShare: () => void;
}

const BIG_SCALE = 11;

/**
 * 작품 상세 바텀시트 (PRD 7.2 · 7.3).
 * 메시지는 이 시점에 노출된다(상시 텍스트 노출 금지 원칙 — PRD 제품원칙 5).
 */
export function CreatureDetailSheet({ creature, onClose, onReport, onShare }: CreatureDetailSheetProps) {
  const [baseW, baseH] = spriteBaseSize(creature.spriteKey);
  const author = displayName({ nickname: creature.authorNickname });
  const releasedAt = creature.publishedAt ?? creature.submittedAt ?? creature.createdAt;

  return (
    <div className="absolute inset-0 z-[60] animate-fadeIn">
      <button
        aria-label="닫기"
        className="absolute inset-0 bg-[rgba(7,45,52,.42)]"
        onClick={onClose}
      />

      {/* 선택된 생물이 시트 위로 떠오름 */}
      <div className="pointer-events-none absolute left-1/2 top-[196px] z-[5] flex -translate-x-1/2 flex-col items-center">
        <CreatureSprite
          creature={creature}
          width={baseW * BIG_SCALE}
          height={baseH * BIG_SCALE}
        />
        <span
          className="mt-[18px] h-3.5 w-24"
          style={{ background: 'radial-gradient(ellipse at center,rgba(4,34,40,.3),rgba(4,34,40,0) 70%)' }}
        />
      </div>

      {/* 바텀 시트 */}
      <div
        className="animate-sheetUp absolute inset-x-0 bottom-0 z-10 mx-auto max-w-2xl rounded-t-3xl bg-white px-6 pt-2.5 shadow-[0_-12px_40px_rgba(4,34,40,.28)]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 26px)' }}
      >
        <span className="mx-auto mb-[18px] block h-1 w-[38px] rounded-full bg-black/15" />
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <h3 className="m-0 text-[21px] font-bold tracking-tight">{creature.name}</h3>
              <KindBadge kind={creature.kind} />
            </div>
            <span className="text-[13px] text-ink-soft">
              {author} · {formatRelativeTime(releasedAt)} 방류
            </span>
          </div>
          <button className="rounded-lg p-1.5 text-ink-faint" onClick={onClose} aria-label="닫기">
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-brand-bg px-4 py-3.5">
          <span className="mt-px text-[17px] font-bold leading-none text-brand">“</span>
          <p className="m-0 text-[15px] font-medium leading-normal text-sea-deep">
            {creature.message || '남긴 한마디가 없어요'}
          </p>
        </div>

        <div className="mt-[18px] flex items-center justify-between gap-3">
          <button className="flex items-center gap-1.5 text-[13px] text-ink-faint" onClick={onReport}>
            <Icon name="warning" size={14} />
            신고하기
          </button>
          <Button variant="primary" onClick={onShare}>
            <Icon name="share" size={16} /> 공유하기
          </Button>
        </div>
      </div>
    </div>
  );
}
