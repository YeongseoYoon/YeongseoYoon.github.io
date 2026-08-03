export type {
  Creature,
  CreatureKind,
  CreatureStatus,
  MotionKind,
} from './model/types';
export type { CreatureRepository, NewCreatureInput, PublicCreatureStats } from './model/repository';
export {
  canTransition,
  nextStatuses,
  isPubliclyVisible,
  isVisibleToOwner,
} from './model/status';
export { KIND_META, STATUS_META, motionForKind } from './model/meta';
export { spriteBaseSize } from './model/sprite';
export {
  slotToPoint,
  isAnchoredKind,
  worldWidthFor,
  WORLD_HEIGHT,
  FLOOR_H,
  FLOOR_Y,
  WATER_TOP,
  WANDER_RADIUS,
  WANDER_X_RADIUS,
  WANDER_Y_RADIUS,
  SWIM_BAND,
} from './model/worldCoords';
export { creatureApi } from './api/creatureApi';
export { creatureFromRow, type CreatureRow } from './api/supabaseCreatureApi';

export { CreatureSprite } from './ui/CreatureSprite';
export { KindBadge, StatusBadge } from './ui/CreatureBadges';
