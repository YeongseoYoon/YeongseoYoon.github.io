import { useState } from 'react';
import type { Creature } from '@/entities/creature';
import { Button, Icon } from '@/shared/ui';
import { buildTankShareUrl, createTankStoryCard } from '../model/share';

interface ShareTankSheetProps {
  authorId: string;
  ownerName: string;
  creatures: Creature[];
  onClose: () => void;
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const input = document.createElement('textarea');
  input.value = value;
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand('copy');
  input.remove();
  if (!copied) throw new Error('링크를 복사하지 못했습니다.');
}

function download(blob: Blob, fileName: string): void {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(href);
}

export function ShareTankSheet({ authorId, ownerName, creatures, onClose }: ShareTankSheetProps) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const url = buildTankShareUrl(authorId);
  const text = `${ownerName}의 끝없는 수족관에 놀러 오세요! 귀여운 생물 ${creatures.length}마리가 기다리고 있어요.`;

  async function shareLink() {
    setStatus(null);
    try {
      if (navigator.share) {
        await navigator.share({ title: `${ownerName}의 끝없는 수족관`, text, url });
        setStatus('공유했어요.');
      } else {
        await copyText(url);
        setStatus('수족관 링크를 복사했어요.');
      }
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') return;
      setStatus('공유하지 못했어요. 링크 복사를 이용해 주세요.');
    }
  }

  async function shareStory() {
    setBusy(true);
    setStatus('수족관 카드를 만드는 중…');
    try {
      const blob = await createTankStoryCard(creatures, ownerName);
      const file = new File([blob], `${ownerName}-끝없는-수족관.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${ownerName}의 끝없는 수족관`, text, url });
        setStatus('공유했어요.');
      } else {
        download(blob, file.name);
        await copyText(url);
        setStatus('스토리 이미지를 저장하고 수족관 링크를 복사했어요.');
      }
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') setStatus(null);
      else setStatus(reason instanceof Error ? reason.message : '공유 카드를 만들지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await copyText(url);
      setStatus('친구가 바로 들어올 수 있는 수족관 링크를 복사했어요.');
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : '링크를 복사하지 못했습니다.');
    }
  }

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

        <div className="mt-5 grid gap-2.5">
          <Button variant="primary" className="h-12 w-full" onClick={shareLink} disabled={busy}>
            <Icon name="share" size={18} /> 카카오톡·메시지로 공유
          </Button>
          <Button variant="outline" className="h-12 w-full" onClick={shareStory} disabled={busy || creatures.length === 0}>
            <Icon name="download" size={18} /> 인스타 스토리용 수족관 카드
          </Button>
          <Button variant="secondary" className="h-12 w-full" onClick={copyLink} disabled={busy}>
            <Icon name="copy" size={18} /> 수족관 링크 복사
          </Button>
        </div>
        {status && <p role="status" className="mb-0 mt-3 text-center text-[13px] font-medium text-sea-mid">{status}</p>}
        <p className="mb-0 mt-4 text-center text-[11.5px] leading-relaxed text-ink-faint">
          휴대폰 공유창에서 카카오톡이나 Instagram을 선택할 수 있어요.
        </p>
      </div>
    </div>
  );
}
