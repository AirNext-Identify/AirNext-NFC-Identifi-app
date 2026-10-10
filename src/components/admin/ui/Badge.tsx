import { cn } from '@/lib/adminUtils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'dot';
  colorClass?: string;
  dotColor?: string;
}

export function Badge({
  children,
  className,
  variant = 'default',
  colorClass = 'bg-zinc-500/10 text-zinc-400',
  dotColor = 'bg-zinc-500',
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variant === 'dot' && 'pl-2',
        colorClass,
        className
      )}
    >
      {variant === 'dot' && <span className={cn('h-1.5 w-1.5 rounded-full', dotColor)} />}
      {children}
    </span>
  );
}
