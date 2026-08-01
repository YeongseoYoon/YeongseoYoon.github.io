import { beforeEach, describe, expect, it } from 'vitest';
import { AUTO_HIDE_REPORT_THRESHOLD, DAILY_REPORT_LIMIT } from '@/shared/config';
import { creatureApi } from '@/entities/creature';
import { moderationLogApi } from '@/entities/moderation-log';
import { reportApi } from '@/entities/report';
import { resetDb } from '@/test/resetDb';
import { submitReport } from '../model/service';

/** 시드에 신고가 없는 공개 작품 */
const TARGET = 'c-nemo';

describe('신고 접수', () => {
  beforeEach(resetDb);

  it('TC-6-1 정상 접수되면 자동 숨김은 아니다', async () => {
    const result = await submitReport({ creatureId: TARGET, reporterId: 'u1', reason: 'spam' });
    expect(result.autoHidden).toBe(false);
    expect(await reportApi.listByCreature(TARGET)).toHaveLength(1);
  });

  it('TC-6-2 같은 사람이 같은 작품을 또 신고하면 거부한다', async () => {
    await submitReport({ creatureId: TARGET, reporterId: 'u1', reason: 'spam' });
    await expect(
      submitReport({ creatureId: TARGET, reporterId: 'u1', reason: 'violence' }),
    ).rejects.toThrow('이미 신고한');
  });

  it('TC-6-3 기타 사유는 주관식 입력이 필수다', async () => {
    await expect(
      submitReport({ creatureId: TARGET, reporterId: 'u1', reason: 'etc', detail: '  ' }),
    ).rejects.toThrow('사유를 적어');
  });

  it('TC-6-4 기타 사유 + 상세를 적으면 저장된다', async () => {
    await submitReport({
      creatureId: TARGET, reporterId: 'u1', reason: 'etc', detail: '같은 그림을 도배해요',
    });
    const [report] = await reportApi.listByCreature(TARGET);
    expect(report.detail).toBe('같은 그림을 도배해요');
  });

  it('TC-6-6 임계 미만이면 공개를 유지한다', async () => {
    for (let i = 0; i < AUTO_HIDE_REPORT_THRESHOLD - 1; i += 1) {
      await submitReport({ creatureId: TARGET, reporterId: `u${i}`, reason: 'spam' });
    }
    expect((await creatureApi.get(TARGET))!.status).toBe('published');
  });

  it('TC-6-5/7 임계를 넘으면 임시 숨김되고 로그가 남는다', async () => {
    let result = { autoHidden: false };
    for (let i = 0; i < AUTO_HIDE_REPORT_THRESHOLD; i += 1) {
      result = await submitReport({ creatureId: TARGET, reporterId: `u${i}`, reason: 'harassment' });
    }
    expect(result.autoHidden).toBe(true);
    expect((await creatureApi.get(TARGET))!.status).toBe('hidden');

    const logs = await moderationLogApi.listRecent(20);
    expect(logs.some((l) => l.creatureId === TARGET && l.action === 'temp_hide')).toBe(true);
  });

  it('TC-6-8 한 사용자의 일일 신고 상한을 넘으면 거부한다', async () => {
    const targets = await creatureApi.listByStatus('published');
    expect(targets.length).toBeGreaterThan(DAILY_REPORT_LIMIT);

    for (const creature of targets.slice(0, DAILY_REPORT_LIMIT)) {
      await submitReport({ creatureId: creature.id, reporterId: 'daily-limiter', reason: 'spam' });
    }
    await expect(
      submitReport({
        creatureId: targets[DAILY_REPORT_LIMIT].id,
        reporterId: 'daily-limiter',
        reason: 'spam',
      }),
    ).rejects.toThrow('오늘 신고할 수 있는 횟수');
  });
});
