import { useState } from 'react';
import { Button, Icon } from '@/shared/ui';
import { MESSAGE_MAX_LENGTH } from '@/shared/config';
import type { Creature } from '@/entities/creature';
import { updateCreatureMessage } from '../model/service';

interface EditMessageSheetProps {
  creature: Creature;
  onClose: () => void;
  onSaved: () => void;
}

/** 내 작품의 한마디를 수정하는 바텀시트. */
export function EditMessageSheet({ creature, onClose, onSaved }: EditMessageSheetProps) {
  const [message, setMessage] = useState(creature.message);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateCreatureMessage(creature.id, message);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했어요.');
      setSaving(false);
    }
  }

  return (
    <div className="absolute inset-0 z-[60] animate-fadeIn">
      <button aria-label="닫기" className="absolute inset-0 bg-[rgba(7,45,52,.42)]" onClick={onClose} />
      <div
        className="animate-sheetUp absolute inset-x-0 bottom-0 z-10 mx-auto max-w-2xl rounded-t-3xl bg-white px-6 pt-2.5 shadow-[0_-12px_40px_rgba(4,34,40,.28)]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
      >
        <span className="mx-auto mb-4 block h-1 w-[38px] rounded-full bg-black/15" />
        <div className="flex items-center justify-between">
          <h3 className="m-0 text-lg font-bold tracking-tight">
            ‘{creature.name}’ 한마디 수정
          </h3>
          <button className="p-1 text-ink-faint" onClick={onClose} aria-label="닫기">
            <Icon name="close" size={20} />
          </button>
        </div>
        <p className="mt-1.5 text-[12.5px] text-ink-soft">
          바꾼 메시지는 바로 저장돼요. 다른 사람은 다음에 볼 때 최신 한마디를 봅니다.
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-ink-sub">생물의 한마디</span>
          <span className="text-xs text-ink-faint">
            {message.length}/{MESSAGE_MAX_LENGTH}
          </span>
        </div>
        <div className="mt-1.5 flex h-11 items-center rounded-lg border border-black/15 px-3">
          <input
            value={message}
            maxLength={MESSAGE_MAX_LENGTH}
            autoFocus
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 border-none bg-transparent text-sm outline-none placeholder:text-ink-faint"
            placeholder="같이 헤엄칠 사람 구해요"
          />
        </div>
        {error && <p className="mt-2 text-[12.5px] text-negative-accessible">{error}</p>}

        <div className="mt-4 flex gap-2">
          <Button variant="secondary" className="flex-1 h-11" onClick={onClose} disabled={saving}>
            취소
          </Button>
          <Button variant="primary" className="flex-1 h-11" onClick={handleSave} disabled={saving}>
            {saving ? '저장 중…' : '저장하기'}
          </Button>
        </div>
      </div>
    </div>
  );
}
