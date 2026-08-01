import { cn } from '@/shared/lib';
import { KIND_META, type CreatureKind } from '@/entities/creature';

interface KindTabsProps {
  kind: CreatureKind;
  onChange: (kind: CreatureKind) => void;
}

const ORDER: CreatureKind[] = ['fish', 'seaweed', 'decoration'];

/** 종류 선택 탭 (물고기·해초·장식물). */
export function KindTabs({ kind, onChange }: KindTabsProps) {
  return (
    <div className="inline-flex gap-0.5 rounded-lg bg-black/[.05] p-1">
      {ORDER.map((k) => {
        const active = kind === k;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onChange(k)}
            className={cn(
              'rounded-md px-3 py-1.5 text-[13px] font-semibold',
              active ? 'bg-white text-ink shadow-sm' : 'text-ink-sub',
            )}
          >
            {KIND_META[k].label}
          </button>
        );
      })}
    </div>
  );
}
