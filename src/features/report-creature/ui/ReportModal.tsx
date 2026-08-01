import { useState } from 'react';
import { Button, Icon } from '@/shared/ui';
import { cn } from '@/shared/lib';
import { useSession } from '@/entities/session';
import { REPORT_REASONS, type ReportReason } from '@/entities/report';
import { submitReport } from '../model/service';

interface ReportModalProps {
  creatureId: string;
  creatureName: string;
  onClose: () => void;
  /** 접수 완료. hideLocally=true면 신고자 화면에서 즉시 숨긴다. */
  onSubmitted: (hideLocally: boolean) => void;
}

/** 신고 모달 (PRD 7.4). 생물 상세에서 열린다. */
export function ReportModal({ creatureId, creatureName, onClose, onSubmitted }: ReportModalProps) {
  const { user } = useSession();
  const [reason, setReason] = useState<ReportReason>('spam');
  const [detail, setDetail] = useState('');
  const [hideLocally, setHideLocally] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitReport({ creatureId, reporterId: user.id, reason, detail });
      onSubmitted(hideLocally);
    } catch (e) {
      setError(e instanceof Error ? e.message : '신고에 실패했어요.');
      setSubmitting(false);
    }
  }

  return (
    <div className="absolute inset-0 z-[60] animate-fadeIn">
      <button
        aria-label="닫기"
        className="absolute inset-0 bg-[rgba(5,30,35,.58)] backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute inset-x-5 top-1/2 mx-auto max-w-md -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_rgba(0,0,0,.3)]">
        <div className="flex items-center justify-between px-6 pb-1 pt-[22px]">
          <h3 className="m-0 text-lg font-bold tracking-tight">신고하기</h3>
          <button className="p-1 text-ink-faint" onClick={onClose} aria-label="닫기">
            <Icon name="close" size={20} />
          </button>
        </div>
        <p className="mx-6 mb-4 mt-1.5 text-[13px] leading-normal text-ink-soft">
          ‘{creatureName}’와 작품 메시지를 신고합니다. 신고 내용은 운영자만 확인해요.
        </p>

        <div className="flex flex-col gap-3.5 px-6">
          {REPORT_REASONS.map((r) => {
            const selected = reason === r.value;
            return (
              <label key={r.value} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="report-reason"
                  className="sr-only"
                  checked={selected}
                  onChange={() => setReason(r.value)}
                />
                <span
                  className={cn(
                    'grid h-[18px] w-[18px] place-items-center rounded-full border-2',
                    selected ? 'border-brand' : 'border-black/30',
                  )}
                >
                  {selected && <i className="h-2 w-2 rounded-full bg-brand" />}
                </span>
                {r.label}
              </label>
            );
          })}
        </div>

        <div className="mx-6 mt-3">
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder={reason === 'etc' ? '어떤 점이 문제인지 알려 주세요 (필수)' : '더 알려주실 내용이 있다면 적어 주세요 (선택)'}
            className="w-full resize-none rounded-lg border border-black/15 px-3 py-2 text-sm outline-none placeholder:text-ink-faint focus:border-brand"
          />
        </div>

        <div className="mx-6 mt-2 rounded-[10px] bg-[#f1f2f3] px-3.5 py-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="sr-only"
              checked={hideLocally}
              onChange={(e) => setHideLocally(e.target.checked)}
            />
            <span
              className={cn(
                'grid h-[18px] w-[18px] place-items-center rounded',
                hideLocally ? 'bg-brand' : 'border-2 border-black/30 bg-white',
              )}
            >
              {hideLocally && <Icon name="check" size={12} className="text-white [stroke-width:3]" />}
            </span>
            이 작품을 내 화면에서 바로 숨기기
          </label>
        </div>

        {error && <p className="mx-6 mt-3 text-[12.5px] text-negative-accessible">{error}</p>}

        <div className="flex justify-end gap-2 px-6 pb-[22px] pt-[18px]">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button variant="danger" onClick={handleSubmit} disabled={submitting}>
            {submitting ? '접수 중…' : '신고 접수'}
          </Button>
        </div>
      </div>
    </div>
  );
}
