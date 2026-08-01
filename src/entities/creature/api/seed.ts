import { getDeviceId } from '@/shared/lib';
import { SEED_USER_ID } from '@/entities/user';
import { SEED_ZONE_ID } from '@/entities/zone';
import type { Creature, CreatureKind, MotionKind } from '../model/types';
import { motionForKind } from '../model/meta';
import { slotToPoint } from '../model/worldCoords';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const ago = (ms: number) => Date.now() - ms;

interface SeedSpec {
  id: string;
  spriteKey: string;
  kind: CreatureKind;
  name: string;
  message: string;
  authorId: string;
  authorNickname: string | null;
  zoneId?: string;
  status?: Creature['status'];
  submittedAgo?: number;
  publishedAgo?: number;
  rejectionReason?: string;
  motion?: MotionKind;
}

/** 시드 정의를 선언적으로 유지하는 빌더. 슬롯 번호로 고정 좌표를 배정한다. */
function make(spec: SeedSpec, slot: number): Creature {
  const status = spec.status ?? 'published';
  const submittedAt = spec.submittedAgo != null ? ago(spec.submittedAgo) : ago(DAY);
  const { worldX, worldY } = slotToPoint(slot, spec.kind);
  return {
    id: spec.id,
    kind: spec.kind,
    motion: spec.motion ?? motionForKind(spec.kind),
    name: spec.name,
    message: spec.message,
    status,
    authorId: spec.authorId,
    authorNickname: spec.authorNickname,
    zoneId: spec.zoneId ?? null,
    sprite: null,
    spriteKey: spec.spriteKey,
    worldX,
    worldY,
    slot,
    rejectionReason: spec.rejectionReason ?? null,
    createdAt: submittedAt,
    submittedAt,
    publishedAt: status === 'published' ? ago(spec.publishedAgo ?? DAY) : null,
  };
}

const U = SEED_USER_ID;
const Z = SEED_ZONE_ID;
/** 이 기기의 창작자 id — "내 작품"이 기기 단위로 묶이도록 (가입 불필요) */
const ME = getDeviceId();

const SPECS: SeedSpec[] = [
  // ── 내 작품 ──
  { id: 'c-juhwang', spriteKey: 'clownfish', kind: 'fish', name: '주황이', message: '같이 헤엄칠 사람 구해요', authorId: ME, authorNickname: '말미잘', zoneId: Z.coral, submittedAgo: 3 * DAY, publishedAgo: 3 * DAY },
  { id: 'c-parang', spriteKey: 'tang', kind: 'fish', name: '파랑이', message: '오늘 새로 왔어요', authorId: ME, authorNickname: '말미잘', zoneId: Z.cove, submittedAgo: 2 * HOUR, publishedAgo: 2 * HOUR },
  { id: 'c-ppyojok', spriteKey: 'coral', kind: 'decoration', name: '뾰족이', message: 'HELLO', authorId: ME, authorNickname: '말미잘', status: 'hidden', submittedAgo: DAY, rejectionReason: '문자가 포함된 그림이라 신고 확인 후 숨김 처리됐어요.' },

  // ── 얕은 산호 정원 ──
  { id: 'c-nemo', spriteKey: 'clownfish', kind: 'fish', name: '니모', message: '산호 사이가 제일 좋아', authorId: U.bbogle, authorNickname: '뽀글뽀글', zoneId: Z.coral, publishedAgo: 5 * HOUR },
  { id: 'c-noran', spriteKey: 'lemon', kind: 'fish', name: '노랑이', message: '레몬맛 물고기', authorId: U.night, authorNickname: '밤하늘', zoneId: Z.coral, publishedAgo: 8 * HOUR },
  { id: 'c-boksun', spriteKey: 'puffer', kind: 'fish', name: '복순이', message: '숨쉬기 운동 중', authorId: U.jipge, authorNickname: '집게손', zoneId: Z.coral, publishedAgo: 12 * HOUR },
  { id: 'c-haemi', spriteKey: 'seahorse', kind: 'fish', name: '해미', message: '꼬리로 붙잡고 쉬어요', authorId: U.haema, authorNickname: '해마지기', zoneId: Z.coral, publishedAgo: DAY },
  { id: 'c-mool', spriteKey: 'jelly', kind: 'fish', name: '몽글이', message: '둥실둥실', authorId: U.night, authorNickname: '밤하늘', zoneId: Z.coral, motion: 'float', publishedAgo: 6 * HOUR },
  { id: 'c-tangtang', spriteKey: 'tang', kind: 'fish', name: '탕탕이', message: '파란 게 좋아', authorId: U.bbogle, authorNickname: '뽀글뽀글', zoneId: Z.coral, publishedAgo: 2 * DAY },
  { id: 'c-byeol', spriteKey: 'star', kind: 'decoration', name: '별사탕', message: '소원을 들어드려요', authorId: U.night, authorNickname: '밤하늘', zoneId: Z.coral, publishedAgo: 4 * HOUR },
  { id: 'c-miyeok', spriteKey: 'weed', kind: 'seaweed', name: '미역이', message: '살랑살랑', authorId: U.shell, authorNickname: '등껍질', zoneId: Z.coral, publishedAgo: 3 * DAY },

  // ── 햇살 어귀 ──
  { id: 'c-jaki', spriteKey: 'minnow', kind: 'fish', name: '자키', message: '무리가 최고야', authorId: U.bbogle, authorNickname: '뽀글뽀글', zoneId: Z.cove, publishedAgo: 7 * HOUR },
  { id: 'c-axo', spriteKey: 'axolotl', kind: 'fish', name: '아소롱', message: '분홍분홍', authorId: U.jipge, authorNickname: '집게손', zoneId: Z.cove, publishedAgo: 10 * HOUR },
  { id: 'c-kelpo', spriteKey: 'kelp', kind: 'seaweed', name: '켈포', message: '해류를 타요', authorId: U.shell, authorNickname: '등껍질', zoneId: Z.cove, publishedAgo: DAY },
  { id: 'c-lemon2', spriteKey: 'lemon', kind: 'fish', name: '새콤이', message: '아침 인사', authorId: U.night, authorNickname: '밤하늘', zoneId: Z.cove, publishedAgo: 2 * HOUR },

  // ── 말미잘 골목 ──
  { id: 'c-jaki2', spriteKey: 'minnow', kind: 'fish', name: '동글이', message: '작지만 빨라요', authorId: U.bbogle, authorNickname: '뽀글뽀글', zoneId: Z.anemone, publishedAgo: 5 * HOUR },
  { id: 'c-crab2', spriteKey: 'crab', kind: 'decoration', name: '옆돌이', message: '옆으로만 걸어요', authorId: U.jipge, authorNickname: '집게손', zoneId: Z.anemone, publishedAgo: 9 * HOUR },
  { id: 'c-star2', spriteKey: 'star', kind: 'decoration', name: '반짝이', message: '반짝반짝', authorId: U.night, authorNickname: '밤하늘', zoneId: Z.anemone, publishedAgo: DAY },

  // ── 거북이 쉼터 ──
  { id: 'c-turt', spriteKey: 'turtle', kind: 'fish', name: '거북선', message: '느려도 괜찮아요', authorId: U.shell, authorNickname: '등껍질', zoneId: Z.turtle, publishedAgo: 6 * HOUR },
  { id: 'c-turt2', spriteKey: 'turtle', kind: 'fish', name: '엉금이', message: '천천히 갈게요', authorId: U.shell, authorNickname: '등껍질', zoneId: Z.turtle, publishedAgo: 2 * DAY },
  { id: 'c-coral2', spriteKey: 'coral', kind: 'decoration', name: '산호돌이', message: '여기 뿌리내렸어요', authorId: U.jipge, authorNickname: '집게손', zoneId: Z.turtle, publishedAgo: 3 * DAY },

  // ── 최근 방류 ──
  { id: 'q-boksun', spriteKey: 'puffer', kind: 'fish', name: '뽀글복순', message: '숨쉬기 운동 중', authorId: U.bbogle, authorNickname: '뽀글뽀글', zoneId: Z.coral, publishedAgo: 10 * MIN },
  { id: 'q-crab', spriteKey: 'crab', kind: 'decoration', name: '옆걸음', message: '옆으로만 걸어요', authorId: U.jipge, authorNickname: '집게손', zoneId: Z.anemone, publishedAgo: 25 * MIN },
  { id: 'q-dong', spriteKey: 'seahorse', kind: 'fish', name: '동해', message: '꼬리로 붙잡고 쉬어요', authorId: U.haema, authorNickname: '해마지기', zoneId: Z.cove, publishedAgo: HOUR },
  { id: 'q-byeol', spriteKey: 'star', kind: 'decoration', name: '소원별', message: '소원을 들어드려요', authorId: U.night, authorNickname: '밤하늘', zoneId: Z.turtle, publishedAgo: 2 * HOUR },
  { id: 'q-turtle', spriteKey: 'turtle', kind: 'fish', name: '느림보', message: '느려도 괜찮아요', authorId: U.shell, authorNickname: '등껍질', zoneId: Z.turtle, publishedAgo: 3 * HOUR },
];

/** 공개 수조를 채우는 시드 작품들. 정서: 귀여운 열대어(PRD 14.5). */
export const seedCreatures = (): Creature[] => SPECS.map((spec, i) => make(spec, i));
