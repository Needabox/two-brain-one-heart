import type { HTMLAttributes, ReactNode } from 'react';

interface PastelCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  tone?: 'cream' | 'lavender' | 'sky' | 'pink' | 'mint';
}

const TONE_MAP: Record<NonNullable<PastelCardProps['tone']>, string> = {
  cream: 'bg-[#FFFDF9]/95 border-[#4A355A]/18',
  lavender: 'bg-[#F5EFFF]/95 border-[#9B8CFF]/45',
  sky: 'bg-[#ECF7FF]/95 border-[#76BDFB]/50',
  pink: 'bg-[#FFF0F5]/95 border-[#FF9AB8]/55',
  mint: 'bg-[#EDFCF5]/95 border-[#6CD3AD]/50',
};

export function PastelCard({
  children,
  className = '',
  tone = 'cream',
  ...rest
}: PastelCardProps) {
  return (
    <div
      className={[
        'rounded-3xl border-[3px] p-4 sm:p-5 shadow-[0_10px_26px_-8px_rgba(74,53,90,0.16),0_4px_0_rgba(74,53,90,0.08)]',
        TONE_MAP[tone],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
