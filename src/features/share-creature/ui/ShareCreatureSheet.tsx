import type { Creature } from '@/entities/creature';
import { Icon } from '@/shared/ui';
import { buildCreatureShareUrl } from '../model/share';
import { LinkShareActions } from './LinkShareActions';

interface ShareCreatureSheetProps {
  creature: Creature;
  onClose: () => void;
}

export function ShareCreatureSheet({ creature, onClose }: ShareCreatureSheetProps) {
  const url = buildCreatureShareUrl(creature.id);
  const text = `${creature.name}이(가) 끝없는 수족관에서 기다리고 있어요. ${creature.message || '같이 구경해요!'}`;

  return (
    <div className="absolute inset-0 z-[70] animate-fadeIn">
      <button aria-label="닫기" className="absolute inset-0 bg-[rgba(7,45,52,.5)]" onClick={onClose} />
      <div
        className="animate-sheetUp absolute inset-x-0 bottom-0 mx-auto max-w-2xl rounded-t-3xl bg-white px-6 pt-2.5 shadow-[0_-12px_40px_rgba(4,34,40,.28)]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 26px)' }}
      >
        <span className="mx-auto mb-4 block h-1 w-[38px] rounded-full bg-black/15" />
        <div className="flex items-start justify-between">
          <div>
            <h3 className="m-0 text-xl font-bold tracking-tight">{creature.name} 공유하기</h3>
            <p className="mt-1 text-[13px] text-ink-soft">친구가 이 생물의 자리로 바로 찾아와요.</p>
          </div>
          <button className="rounded-lg p-1.5 text-ink-faint" onClick={onClose} aria-label="닫기">
            <Icon name="close" size={20} />
          </button>
        </div>

        <LinkShareActions
          data={{
            title: `${creature.name} · 끝없는 수족관`,
            text,
            url,
            buttonTitle: `${creature.name} 만나러 가기`,
          }}
          linkLabel="생물"
        />
      </div>
    </div>
  );
}
