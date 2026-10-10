import { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

/**
 * Card — container padrão do design system.
 * Substitui divs repetidas com `glass rounded-xl p-4 border ...` espalhadas pelo app.
 *
 * Uso:
 *   <Card><Card.Header>Título</Card.Header><Card.Body>...</Card.Body></Card>
 */
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'glass' | 'solid' | 'outline';
}

const paddingClasses = { none: '', sm: 'p-3', md: 'p-4 sm:p-5', lg: 'p-6 sm:p-8' };
const variantClasses = {
  glass: 'glass',
  solid: 'bg-surface-900 border border-white/5',
  outline: 'bg-transparent border border-white/10',
};

export function Card({ padding = 'md', variant = 'glass', className, children, ...props }: CardProps) {
  return (
    <div className={cn('rounded-2xl', variantClasses[variant], paddingClasses[padding], className)} {...props}>
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between gap-3 mb-4', className)} {...props}>
      {children}
    </div>
  );
};

Card.Body = function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-3', className)} {...props}>{children}</div>;
};

Card.Footer = function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-end gap-2 mt-5 pt-4 border-t border-white/5', className)} {...props}>
      {children}
    </div>
  );
};
