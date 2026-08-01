export interface LinkShareData {
  title: string;
  text: string;
  url: string;
  buttonTitle: string;
}

interface KakaoSdk {
  isInitialized(): boolean;
  init(key: string): void;
  Share: {
    sendDefault(input: {
      objectType: 'feed';
      content: {
        title: string;
        description: string;
        imageUrl: string;
        link: { mobileWebUrl: string; webUrl: string };
      };
      buttons: Array<{
        title: string;
        link: { mobileWebUrl: string; webUrl: string };
      }>;
    }): void;
  };
}

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

export async function copyShareLink(url: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(url);
  const input = document.createElement('textarea');
  input.value = url;
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand('copy');
  input.remove();
  if (!copied) throw new Error('링크를 복사하지 못했습니다.');
}

/** 카카오 JavaScript 키가 설정된 환경에서는 공식 카카오톡 공유창을 바로 연다. */
export function shareToKakao(data: LinkShareData): boolean {
  const key = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY?.trim();
  const kakao = window.Kakao;
  if (!key || !kakao) return false;
  if (!kakao.isInitialized()) kakao.init(key);
  kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: data.title,
      description: data.text,
      imageUrl: 'https://endless-aquarium.vercel.app/og-aquarium.png',
      link: { mobileWebUrl: data.url, webUrl: data.url },
    },
    buttons: [{
      title: data.buttonTitle,
      link: { mobileWebUrl: data.url, webUrl: data.url },
    }],
  });
  return true;
}

/** OS 공유창을 열고, 지원하지 않는 브라우저에서는 링크 복사로 대체한다. */
export async function shareToOtherApps(data: LinkShareData): Promise<'shared' | 'copied'> {
  if (navigator.share) {
    await navigator.share({ title: data.title, text: data.text, url: data.url });
    return 'shared';
  }
  await copyShareLink(data.url);
  return 'copied';
}
