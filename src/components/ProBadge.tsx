import { Crown } from 'lucide-react';

type ProBadgeProps = {
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
};

export function ProBadge({ className = '', showIcon = true, size = 'md' }: ProBadgeProps) {
  const sizeClass =
    size === 'sm'
      ? 'px-3 py-1 text-[8px] gap-1 min-h-[1.4rem]'
      : 'px-4 py-1.5 text-[9px] gap-1.5 min-h-[1.65rem]';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-white text-amber-600 font-bold uppercase tracking-wide outline-none ring-0 box-border ${sizeClass} ${className}`}
      style={{
        border: '2px solid #f59e0b',
        boxShadow: '0 0 14px rgba(245, 158, 11, 0.55)',
      }}
    >
      {showIcon && <Crown className="w-3 h-3 text-amber-500 shrink-0" strokeWidth={2.25} />}
      Pro
    </span>
  );
}
