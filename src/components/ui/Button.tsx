import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Button — peça base do design system.
 *
 * Uso:
 *   <Button>Salvar</Button>
 *   <Button variant="outline" size="sm">Cancelar</Button>
 *   <Button variant="primary" customColor="#22c55e">Ativar</Button>
 *
 * `customColor` permite que cada usuário tenha sua cor de marca aplicada
 * ao botão primário/outline sem precisar de uma classe Tailwind nova por cor.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'transparent' | 'glass' | 'glow';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Cor de marca custom (hex). Sobrepõe o estilo padrão do variant. */
  customColor?: string;
  fullWidth?: boolean;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3.5 text-sm rounded-2xl gap-2.5',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm shadow-brand-600/20',
  secondary: 'bg-surface-800 hover:bg-surface-700 text-white',
  outline: 'border border-white/15 text-white hover:bg-white/5 bg-transparent',
  ghost: 'text-zinc-400 hover:text-white hover:bg-white/5 bg-transparent',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/20',
  // Fully transparent — no fill until interaction, for toolbars/icon rows.
  transparent: 'bg-transparent text-zinc-300 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10',
  // Light glassmorphism — for surfaces sitting on top of images/gradients/wallpapers.
  glass: 'bg-white/10 backdrop-blur-md border border-white/15 text-white hover:bg-white/15 shadow-sm shadow-black/10',
  // Primary CTA with a soft glow halo — for the one action per screen that should pop.
  glow: 'bg-brand-600 hover:bg-brand-500 text-white shadow-[0_0_0_1px_rgba(99,102,241,0.4),0_8px_24px_-4px_rgba(99,102,241,0.55)] hover:shadow-[0_0_0_1px_rgba(99,102,241,0.5),0_10px_32px_-4px_rgba(99,102,241,0.7)]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, customColor, fullWidth, className, children, disabled, style, ...props },
  ref
) {
  const customStyle =
    customColor && (variant === 'primary' || variant === 'danger' || variant === 'glow')
      ? { backgroundColor: customColor, ...style }
      : customColor && variant === 'outline'
      ? { borderColor: customColor, color: customColor, ...style }
      : style;

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      style={customStyle}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all duration-200',
        'active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        sizeClasses[size],
        !customColor && variantClasses[variant],
        customColor && variant === 'outline' && 'border bg-transparent hover:opacity-80',
        customColor && (variant === 'primary' || variant === 'danger' || variant === 'glow') && 'text-white hover:opacity-90',
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});
