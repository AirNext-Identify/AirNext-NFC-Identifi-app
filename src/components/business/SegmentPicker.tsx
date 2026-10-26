import { useId, useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import {
  OTHER_SEGMENT_ID,
  SEGMENT_GROUPS,
  getSegment,
  searchSegments,
} from '../../config/businessSegments';

interface SegmentPickerProps {
  /** Id do segmento salvo em profile_data.__segment (ou vazio). */
  value?: string;
  /** Texto livre salvo em profile_data.__segmentOutro. */
  otherText?: string;
  onChange: (segmentId: string) => void;
  onOtherTextChange: (text: string) => void;
}

/**
 * Seletor de ramo de atividade do Business.
 * - Radios nativos (setas do teclado funcionam) com foco visível.
 * - Alvos de toque de 48px; busca por nome e palavras-chave, sem acento.
 * - Sem animações além de transições de cor, desligadas com prefers-reduced-motion.
 */
export function SegmentPicker({ value, otherText = '', onChange, onOtherTextChange }: SegmentPickerProps) {
  const [query, setQuery] = useState('');
  const name = useId();
  const searchId = useId();
  const otherId = useId();

  const results = useMemo(() => searchSegments(query), [query]);
  const selected = getSegment(value);

  return (
    <div className="space-y-3">
      <div className="relative">
        <label htmlFor={searchId} className="sr-only">Buscar ramo de atividade</label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar: barbearia, dentista, cafeteria…"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#3B82F6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50"
        />
      </div>

      <div role="radiogroup" aria-label="Ramo de atividade" className="space-y-4">
        {SEGMENT_GROUPS.map((group) => {
          const items = results.filter((s) => s.group === group.id);
          if (items.length === 0) return null;
          return (
            <fieldset key={group.id} className="min-w-0">
              <legend className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{group.label}</legend>
              <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                {items.map((s) => {
                  const Icon = s.icon;
                  const checked = s.id === value;
                  return (
                    <label key={s.id} className="relative block cursor-pointer">
                      <input
                        type="radio"
                        name={name}
                        value={s.id}
                        checked={checked}
                        onChange={() => onChange(s.id)}
                        className="peer sr-only"
                      />
                      <span
                        className="flex min-h-[48px] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left text-sm text-zinc-200 motion-safe:transition-colors hover:bg-white/[0.07] peer-checked:border-[#3B82F6]/70 peer-checked:bg-[#2563EB]/15 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#60A5FA]"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]" aria-hidden>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1 leading-snug">{s.label}</span>
                        {checked && <Check className="h-4 w-4 shrink-0 text-[#60A5FA]" aria-hidden />}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}

        {results.length === 0 && (
          <p role="status" className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center text-sm text-zinc-400">
            Nenhum ramo encontrado para “{query}”. Limpe a busca e escolha <strong className="text-zinc-200">Outro segmento</strong> para digitar o seu.
          </p>
        )}
      </div>

      {selected?.id === OTHER_SEGMENT_ID && (
        <div>
          <label htmlFor={otherId} className="mb-1 block text-[11px] font-medium text-zinc-300">Qual é o seu ramo de atividade?</label>
          <input
            id={otherId}
            value={otherText}
            maxLength={60}
            onChange={(e) => onOtherTextChange(e.target.value)}
            placeholder="Ex: Estúdio de tatuagem"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#3B82F6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50"
          />
        </div>
      )}
    </div>
  );
}
