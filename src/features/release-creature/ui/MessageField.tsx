import { MESSAGE_MAX_LENGTH } from '@/shared/config';

interface MessageFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/** 30자 이하 작품 한마디 입력 + 카운터 (PRD 7.1). */
export function MessageField({ value, onChange }: MessageFieldProps) {
  return (
    <div>
      <div className="mb-[7px] flex items-center justify-between">
        <label className="text-[13px] font-semibold text-ink-sub">
          생물의 한마디 <span className="font-normal text-ink-faint">(선택)</span>
        </label>
        <span className="text-xs text-ink-faint">
          {value.length}/{MESSAGE_MAX_LENGTH}
        </span>
      </div>
      <div className="flex h-10 items-center rounded-lg border border-black/15 px-3">
        <input
          value={value}
          maxLength={MESSAGE_MAX_LENGTH}
          onChange={(e) => onChange(e.target.value)}
          placeholder="같이 헤엄칠 사람 구해요"
          className="flex-1 border-none bg-transparent text-sm outline-none placeholder:text-ink-faint"
        />
      </div>
    </div>
  );
}
