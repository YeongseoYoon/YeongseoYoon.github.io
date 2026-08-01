import { useNavigate } from 'react-router-dom';
import { Screen, ScreenHeader } from '@/shared/ui';

const SECTIONS = [
  {
    title: '함께 지키는 콘텐츠 가이드',
    items: [
      '직접 그렸거나 사용할 권리가 있는 그림만 방류해 주세요.',
      '혐오·괴롭힘·성적 표현·과도한 폭력처럼 다른 사람을 해치는 내용은 올릴 수 없어요.',
      '전화번호, 계정, 주소 등 본인이나 다른 사람의 개인정보를 그림·이름·한마디에 넣지 마세요.',
      '광고, 반복 도배, 외부 링크 유도, 다른 사람의 작품 사칭은 숨김 또는 이용 제한 대상이에요.',
    ],
  },
  {
    title: '신고와 운영 조치',
    items: [
      '방류된 작품은 바로 공개되며, 신고가 누적되면 확인 전까지 자동으로 숨겨질 수 있어요.',
      '운영자는 신고 내용과 작품을 확인해 공개 복구, 숨김 또는 반려 조치를 할 수 있어요.',
      '신고 도배를 막기 위해 한 사용자당 하루 최대 10건까지 신고할 수 있어요.',
      '긴급한 권리 침해나 범죄 관련 요청은 서비스 운영자가 별도 확인할 수 있어요.',
    ],
  },
  {
    title: '가입 없는 이용과 데이터',
    items: [
      '웹에서는 같은 브라우저 프로필의 익명 키와 Supabase 익명 세션으로 내 작품을 구분해요.',
      '다른 브라우저·시크릿 창은 별도 사용자이며, 브라우저 데이터를 모두 지우면 기존 소유권을 복구할 수 없어요.',
      '그림은 이미지 파일이 아니라 36×32 픽셀을 압축한 문자열로 저장돼요.',
      '공개 작품의 그림, 이름, 한마디와 익명 창작자 이름은 다른 이용자에게 표시돼요.',
    ],
  },
] as const;

/** 공개 전 확인할 수 있는 최소 이용 안내·콘텐츠 가이드. */
export function GuidelinesPage() {
  const navigate = useNavigate();
  return (
    <Screen variant="content" className="flex flex-col bg-white">
      <div className="h-3 shrink-0" />
      <ScreenHeader title="이용 안내" onBack={() => navigate(-1)} />
      <main className="min-h-0 flex-1 overflow-y-auto px-6 pb-28 pt-3">
        <div className="rounded-3xl bg-brand-bg px-5 py-5">
          <p className="m-0 text-[12px] font-bold text-brand-accessible">끝없는 수족관</p>
          <h1 className="mb-2 mt-1 text-[22px] font-bold tracking-tight text-sea-deep">
            모두가 편안한 바다를 만들어요
          </h1>
          <p className="m-0 text-[13px] leading-relaxed text-sea-mid">
            그림을 방류하거나 다른 작품을 신고하기 전에 아래 원칙을 확인해 주세요.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          {SECTIONS.map((section) => (
            <section key={section.title} className="rounded-2xl border border-black/[.08] p-5">
              <h2 className="m-0 text-[16px] font-bold text-ink">{section.title}</h2>
              <ul className="mb-0 mt-3 flex list-disc flex-col gap-2 pl-5 text-[13px] leading-relaxed text-ink-sub">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className="mt-5 text-center text-[11.5px] text-ink-faint">시행일 2026년 8월 2일</p>
      </main>
    </Screen>
  );
}
