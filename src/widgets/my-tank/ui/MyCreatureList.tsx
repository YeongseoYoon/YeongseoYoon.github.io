import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/shared/ui';
import { cn, formatRelativeTime } from '@/shared/lib';
import { CreatureSprite, StatusBadge, spriteBaseSize, type Creature } from '@/entities/creature';
import { useSession } from '@/entities/session';
import { EditMessageSheet, deleteMyCreature } from '@/features/edit-creature';

interface MyCreatureListProps {
  creatures: Creature[];
  onChanged: () => void;
}

/** 내 작품 리스트. 한마디 수정·삭제·이동, 반려/숨김은 사유 + 다시 그리기. */
export function MyCreatureList({ creatures, onChanged }: MyCreatureListProps) {
  const [editing, setEditing] = useState<Creature | null>(null);

  return (
    <>
      <div
        className="mx-5 mt-[18px] flex min-h-0 flex-1 flex-col overflow-y-auto"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}
      >
        <span className="mb-1 text-[13px] font-bold">내 작품</span>
        {creatures.length === 0 && (
          <p className="py-8 text-center text-[13px] text-ink-faint">아직 그린 생물이 없어요.</p>
        )}
        {creatures.map((c) => (
          <MyCreatureListItem
            key={c.id}
            creature={c}
            onEdit={() => setEditing(c)}
            onChanged={onChanged}
          />
        ))}
      </div>

      {editing && (
        <EditMessageSheet
          creature={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChanged();
          }}
        />
      )}
    </>
  );
}

function MyCreatureListItem({
  creature,
  onEdit,
  onChanged,
}: {
  creature: Creature;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const navigate = useNavigate();
  const { user } = useSession();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [w, h] = spriteBaseSize(creature.spriteKey);

  const takenDown = creature.status === 'rejected' || creature.status === 'hidden';
  const published = creature.status === 'published';
  const isDraft = creature.status === 'draft';

  async function handleDelete() {
    if (!user) return;
    setDeleting(true);
    try {
      await deleteMyCreature(creature.id, user.id);
      onChanged();
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5 border-b border-black/[.07] py-4">
      <div className="flex items-center gap-3.5">
        <span
          className={cn(
            'grid h-[52px] w-16 shrink-0 place-items-center overflow-hidden rounded-xl',
            takenDown || isDraft ? 'bg-[#f1f2f3]' : 'water-tank',
          )}
        >
          <CreatureSprite
            creature={creature}
            width={w * 3.5}
            height={h * 3.5}
            animate={!takenDown}
            shadow={false}
            className={takenDown ? 'opacity-55' : undefined}
          />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <div className="flex items-center gap-[7px]">
            <span className="truncate text-[15px] font-semibold">{creature.name}</span>
            <StatusBadge status={creature.status} />
          </div>
          <span className="text-[12.5px] text-ink-faint">{subtitle(creature)}</span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {published && (
            <>
              <IconButton label="한마디 수정" onClick={onEdit}>
                <Icon name="edit" size={15} />
              </IconButton>
              <button
                onClick={() => navigate(`/?focus=${creature.id}`)}
                className="flex h-8 items-center gap-1 rounded-lg bg-brand px-2.5 text-[12.5px] font-semibold text-white"
              >
                이동
                <Icon name="chevron-right" size={13} />
              </button>
            </>
          )}
          {isDraft && (
            <button
              onClick={() => navigate(`/draw?edit=${creature.id}`)}
              className="flex h-8 items-center rounded-lg bg-brand px-2.5 text-[12.5px] font-semibold text-white"
            >
              이어 그리기
            </button>
          )}
          <IconButton label="삭제" onClick={() => setConfirming(true)}>
            <Icon name="trash" size={15} />
          </IconButton>
        </div>
      </div>

      {takenDown && (
        <div className="ml-[78px] flex flex-col gap-1.5 rounded-[10px] bg-negative-bg px-3 py-2.5">
          <span className="text-[12.5px] leading-snug text-negative-accessible">
            사유: {creature.rejectionReason ?? '가이드에 맞지 않아요.'}
          </span>
          <button
            className="text-left text-[12.5px] font-semibold text-brand-accessible hover:underline"
            onClick={() => navigate(`/draw?edit=${creature.id}`)}
          >
            원본 불러와 다시 그리기
          </button>
        </div>
      )}

      {confirming && (
        <div className="ml-[78px] flex items-center justify-between gap-3 rounded-[10px] bg-[#f1f2f3] px-3 py-2.5">
          <span className="text-[12.5px] text-ink-sub">삭제하면 되돌릴 수 없어요.</span>
          <div className="flex shrink-0 gap-1.5">
            <button
              className="h-8 rounded-lg bg-black/[.06] px-2.5 text-[12.5px] font-semibold text-ink-sub"
              onClick={() => setConfirming(false)}
              disabled={deleting}
            >
              취소
            </button>
            <button
              className="h-8 rounded-lg bg-negative px-2.5 text-[12.5px] font-semibold text-white"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '삭제 중…' : '삭제'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-lg border border-black/10 text-ink-sub"
    >
      {children}
    </button>
  );
}

function subtitle(c: Creature): string {
  switch (c.status) {
    case 'published':
      return `공개 중 · ${formatRelativeTime(c.publishedAt ?? c.createdAt)}`;
    case 'draft':
      return '임시저장 · 아직 바다에 없어요';
    case 'rejected':
      return `${formatRelativeTime(c.submittedAt ?? c.createdAt)} 제출`;
    case 'hidden':
      return '신고 확인 후 숨김 처리됨';
    default:
      return formatRelativeTime(c.createdAt);
  }
}
