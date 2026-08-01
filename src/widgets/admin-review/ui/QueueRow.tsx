import { cn, formatRelativeTime } from '@/shared/lib';
import { CreatureSprite, KindBadge, spriteBaseSize, type Creature } from '@/entities/creature';
import { Badge } from '@/shared/ui';

interface QueueRowProps {
  creature: Creature;
  selected: boolean;
  onSelect: () => void;
  /** 이전 반려 이력 등 부가 뱃지 */
  priorRejection?: boolean;
}

/** 검토 대기 큐의 한 행. */
export function QueueRow({ creature, selected, onSelect, priorRejection }: QueueRowProps) {
  const [w, h] = spriteBaseSize(creature.spriteKey);
  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-4 px-6 py-4 text-left',
        selected ? 'border-l-[3px] border-brand bg-brand-bg' : 'border-t border-black/[.07]',
      )}
    >
      <span className="grid h-14 w-[72px] shrink-0 place-items-center overflow-hidden rounded-[10px] water-tank">
        <CreatureSprite creature={creature} width={w * 4} height={h * 4} shadow={false} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <div className="flex items-center gap-2">
          <span className="text-[14.5px] font-semibold">{creature.name}</span>
          <KindBadge kind={creature.kind} />
          {priorRejection && <Badge tone="warning">이전 반려 1회</Badge>}
        </div>
        <span className="truncate text-[13px] text-ink-sub">“{creature.message}”</span>
        <span className="text-xs text-ink-faint">
          {creature.authorNickname ?? '무명'} · {formatRelativeTime(creature.submittedAt ?? creature.createdAt)} 제출
        </span>
      </div>
    </button>
  );
}
