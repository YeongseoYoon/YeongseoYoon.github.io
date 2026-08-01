import { useState } from 'react';
import { Button, Icon } from '@/shared/ui';
import {
  copyShareLink,
  shareToKakao,
  shareToOtherApps,
  type LinkShareData,
} from '../model/linkShare';

export function LinkShareActions({ data, linkLabel }: { data: LinkShareData; linkLabel: string }) {
  const [status, setStatus] = useState<string | null>(null);

  async function handleKakao() {
    setStatus(null);
    try {
      if (shareToKakao(data)) return;
      const result = await shareToOtherApps(data);
      setStatus(result === 'shared'
        ? '공유 앱에서 카카오톡을 선택해 주세요.'
        : '카카오톡에 붙여 넣을 링크를 복사했어요.');
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') return;
      setStatus('공유하지 못했어요. 링크 복사를 이용해 주세요.');
    }
  }

  async function handleInstagram() {
    try {
      await copyShareLink(data.url);
      setStatus('링크를 복사했어요. Instagram 스토리의 링크 스티커에 붙여 넣어 주세요.');
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : '링크를 복사하지 못했습니다.');
    }
  }

  async function handleCopy() {
    try {
      await copyShareLink(data.url);
      setStatus(`${linkLabel} 링크를 복사했어요.`);
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : '링크를 복사하지 못했습니다.');
    }
  }

  async function handleMore() {
    setStatus(null);
    try {
      const result = await shareToOtherApps(data);
      setStatus(result === 'shared' ? '공유했어요.' : `${linkLabel} 링크를 복사했어요.`);
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') return;
      setStatus('공유하지 못했어요. 링크 복사를 이용해 주세요.');
    }
  }

  return (
    <>
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <Button variant="primary" className="h-12 w-full !bg-[#FEE500] !text-[#191919]" onClick={handleKakao}>
          <span className="text-[15px] font-black">K</span> 카카오톡
        </Button>
        <Button variant="outline" className="h-12 w-full" onClick={handleInstagram}>
          <span aria-hidden className="text-base">◎</span> Instagram
        </Button>
        <Button variant="secondary" className="h-12 w-full" onClick={handleCopy}>
          <Icon name="copy" size={17} /> 링크 복사
        </Button>
        <Button variant="secondary" className="h-12 w-full" onClick={handleMore}>
          <Icon name="share" size={17} /> 다른 앱
        </Button>
      </div>
      {status && <p role="status" className="mb-0 mt-3 text-center text-[13px] font-medium text-sea-mid">{status}</p>}
      <p className="mb-0 mt-4 text-center text-[11.5px] leading-relaxed text-ink-faint">
        공유되는 내용은 이미지 파일이 아닌 이 서비스로 연결되는 링크예요.
      </p>
    </>
  );
}
