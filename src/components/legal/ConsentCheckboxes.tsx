import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { DOCUMENT_META } from '../../config/legal';
import { cn } from '../../utils/cn';

export interface ConsentState {
  privacy: boolean;
  terms: boolean;
  marketing: boolean;
}

interface ConsentCheckboxesProps {
  value: ConsentState;
  onChange: (next: ConsentState) => void;
  variant?: 'light' | 'dark';
  className?: string;
  showMarketing?: boolean;
}

function CheckboxRow({
  checked,
  onToggle,
  children,
  variant,
  id,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  variant: 'light' | 'dark';
  id: string;
}) {
  const isDark = variant === 'dark';
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-xl p-3 transition',
        isDark ? 'hover:bg-white/5' : 'hover:bg-zinc-50'
      )}
    >
      <button
        type="button"
        id={id}
        role="checkbox"
        aria-checked={checked}
        onClick={(e) => {
          e.preventDefault();
          onToggle();
        }}
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          checked
            ? 'border-transparent bg-zinc-900 text-white'
            : isDark
              ? 'border-white/25 bg-white/5'
              : 'border-zinc-300 bg-white',
          isDark
            ? 'focus-visible:ring-white/40 focus-visible:ring-offset-zinc-900'
            : 'focus-visible:ring-zinc-400 focus-visible:ring-offset-white'
        )}
      >
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>
      <span className={cn('text-sm leading-snug', isDark ? 'text-zinc-300' : 'text-zinc-600')}>
        {children}
      </span>
    </label>
  );
}

export function ConsentCheckboxes({
  value,
  onChange,
  variant = 'dark',
  className,
  showMarketing = true,
}: ConsentCheckboxesProps) {
  const linkCls =
    variant === 'dark'
      ? 'font-medium text-[#93c5fd] underline-offset-2 hover:underline'
      : 'font-medium text-zinc-900 underline-offset-2 hover:underline';

  return (
    <div className={cn('space-y-1', className)} role="group" aria-label="Consentimentos">
      <CheckboxRow
        id="consent-privacy"
        checked={value.privacy}
        variant={variant}
        onToggle={() => onChange({ ...value, privacy: !value.privacy })}
      >
        Li e estou ciente da{' '}
        <Link
          to={DOCUMENT_META.privacy_policy.path}
          target="_blank"
          rel="noopener noreferrer"
          className={linkCls}
        >
          Política de Privacidade
        </Link>
        .
      </CheckboxRow>

      <CheckboxRow
        id="consent-terms"
        checked={value.terms}
        variant={variant}
        onToggle={() => onChange({ ...value, terms: !value.terms })}
      >
        Li e concordo com os{' '}
        <Link
          to={DOCUMENT_META.terms_of_use.path}
          target="_blank"
          rel="noopener noreferrer"
          className={linkCls}
        >
          Termos de Uso
        </Link>
        .
      </CheckboxRow>

      {showMarketing && (
        <CheckboxRow
          id="consent-marketing"
          checked={value.marketing}
          variant={variant}
          onToggle={() => onChange({ ...value, marketing: !value.marketing })}
        >
          Aceito receber novidades e comunicações da AirNext.{' '}
          <span className="opacity-70">(opcional)</span>
        </CheckboxRow>
      )}
    </div>
  );
}

export function consentsRequiredOk(c: ConsentState) {
  return c.privacy && c.terms;
}
