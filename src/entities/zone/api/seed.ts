import type { Zone } from '../model/types';

/** 안정적인 시드 구역 id — 작품이 zoneId로 참조한다. */
export const SEED_ZONE_ID = {
  cove: 'zone-cove',
  coral: 'zone-coral',
  anemone: 'zone-anemone',
  turtle: 'zone-turtle',
} as const;

/** 첫 공개 수조 정서: 귀여운 열대어 (PRD 14.5 결정). 밝고 얕은 바다 톤의 구역명. */
export const seedZones = (): Zone[] => [
  {
    id: SEED_ZONE_ID.cove,
    name: '햇살 어귀',
    subtitle: '물빛이 가장 밝은 얕은 바다',
    order: 1,
    capacity: 120,
    acceptingReleases: true,
  },
  {
    id: SEED_ZONE_ID.coral,
    name: '얕은 산호 정원',
    subtitle: '알록달록 열대어가 모이는 곳',
    order: 2,
    capacity: 150,
    acceptingReleases: true,
  },
  {
    id: SEED_ZONE_ID.anemone,
    name: '말미잘 골목',
    subtitle: '작은 물고기들의 숨바꼭질',
    order: 3,
    capacity: 120,
    acceptingReleases: true,
  },
  {
    id: SEED_ZONE_ID.turtle,
    name: '거북이 쉼터',
    subtitle: '느긋한 친구들이 쉬어 가는 자리',
    order: 4,
    capacity: 100,
    acceptingReleases: true,
  },
];
