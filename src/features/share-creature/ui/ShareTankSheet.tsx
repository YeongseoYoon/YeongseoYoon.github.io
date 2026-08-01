import type { Creature } from '@/entities/creature';
import { Icon } from '@/shared/ui';
import { buildTankShareUrl } from '../model/share';
import { LinkShareActions } from './LinkShareActions';

interface ShareTankSheetProps {
  authorId: string;
  ownerName: string;
  creatures: Creature[];
  onClose: () => void;
}

export function ShareTankSheet({ authorId, ownerName, creatures, onClose }: ShareTankSheetProps) {
  const url = buildTankShareUrl(authorId);
  const text = `${ownerName}의 끝없는 수족관에 놀러 오세요! 귀여운 생물 ${creatures.length}마리가 기다리고 있어요.`;

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
            <h3 className="m-0 text-xl font-bold tracking-tight">내 수족관 공유하기 🫧</h3>
            <p className="mt-1 text-[13px] text-ink-soft">친구가 내 생물들을 한 번에 구경할 수 있어요.</p>
          </div>
          <button className="rounded-lg p-1.5 text-ink-faint" onClick={onClose} aria-label="닫기">
            <Icon name="close" size={20} />
          </button>
        </div>

        <LinkShareActions
          data={{
            title: `${ownerName}의 끝없는 수족관`,
            text,
            url,
            buttonTitle: '수족관 구경하기',
          }}
          linkLabel="수족관"
        />
      </div>
    </div>
  );
}
