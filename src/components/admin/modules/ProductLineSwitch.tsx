import { Plus } from 'lucide-react';
import { cn } from '@/lib/adminUtils';

export type ProductLine = 'std' | 'google';

interface ProductLineSwitchProps {
  value: ProductLine;
  onChange: (line: ProductLine) => void;
  /** Rótulo da linha padrão (ex.: "Lotes AirNext" / "Produtos AirNext"). */
  stdLabel: string;
  googleLabel: string;
  /** Abre a criação de lote AirNext Google. */
  onCreateGoogleLot: () => void;
}

/**
 * Barra que une as duas linhas (padrão e AirNext Google) dentro de Lotes e
 * Produtos, com o atalho "Gerar lote Google" sempre à mão.
 */
export function ProductLineSwitch({ value, onChange, stdLabel, googleLabel, onCreateGoogleLot }: ProductLineSwitchProps) {
  return (
    <div className="flex flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pt-6">
      <div className="inline-flex self-start rounded-xl border border-zinc-800 bg-zinc-900 p-1">
        {([
          ['std', stdLabel],
          ['google', googleLabel],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              value === id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        onClick={onCreateGoogleLot}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
      >
        <Plus className="h-4 w-4" /> Gerar lote Google
      </button>
    </div>
  );
}
