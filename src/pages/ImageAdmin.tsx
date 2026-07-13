import { useRef, useState } from 'react';
import { ALL_SITE_MEDIA_SLOTS, ImageSlot } from '../config/site-images';
import { useSiteImages } from '../hooks/useSiteImages';

// Troque essa senha por uma sua. É só uma trava simples para visitantes não
// acharem o atalho por acaso — não é segurança de verdade (o código roda no
// navegador). Se quiser algo mais sério, proteja essa rota no back-end.
const ADMIN_PASSWORD = 'airnext2026';
const SESSION_KEY = 'airnext_admin_unlocked';

// Limite de tamanho por tipo de arquivo ao enviar do computador (fica salvo
// como base64 no localStorage, que tem ~5MB de limite total no navegador).
const MAX_IMAGE_MB = 1.5;
const MAX_VIDEO_MB = 4;

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const tryUnlock = () => {
    if (value === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      onUnlock();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-sm bg-[#121212] border border-white/10 rounded-3xl p-6 sm:p-8">
        <h1 className="text-white text-lg font-bold mb-1">Admin de Mídia</h1>
        <p className="text-gray-400 text-sm mb-6">Digite a senha para editar as imagens e vídeos do site.</p>
        <input
          type="password"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === 'Enter' && tryUnlock()}
          placeholder="Senha"
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm mb-3 focus:outline-none focus:border-[#0071e3]"
          autoFocus
        />
        {error && <p className="text-red-400 text-xs mb-3">Senha incorreta.</p>}
        <button onClick={tryUnlock} className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold rounded-xl py-3 text-sm transition active:scale-[0.98]">
          Entrar
        </button>
      </div>
    </div>
  );
}

function MediaSlotRow({
  slot,
  currentUrl,
  onChange,
  onReset,
}: {
  slot: ImageSlot;
  currentUrl: string;
  onChange: (url: string) => void;
  onReset: () => void;
}) {
  const isVideo = slot.type === 'video';
  const [urlDraft, setUrlDraft] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const flashSaved = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  };

  const handleUrlSave = () => {
    if (!urlDraft.trim()) return;
    onChange(urlDraft.trim());
    setUrlDraft('');
    flashSaved();
  };

  const handleFile = (file: File) => {
    // localStorage tem limite (~5MB no total). Para arquivos grandes, o ideal
    // é hospedar em algum lugar (ex: Cloudinary, YouTube/Vimeo p/ vídeo, seu
    // storage) e colar o link em vez de enviar do computador.
    const maxMb = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
    if (file.size > maxMb * 1024 * 1024) {
      alert(
        isVideo
          ? `Esse vídeo tem mais de ${maxMb}MB. Hospede em algum lugar (ex: YouTube, Vimeo, Cloudinary, seu storage) e cole o link, em vez de enviar o arquivo direto.`
          : `Essa imagem tem mais de ${maxMb}MB. Comprima antes (ex: squoosh.app) ou cole uma URL já hospedada.`
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
      flashSaved();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 sm:gap-5">
      <div className="w-full md:w-36 flex-shrink-0">
        <div className={`w-full ${isVideo ? 'aspect-video' : 'aspect-square'} rounded-xl overflow-hidden bg-black/40 border border-white/10`}>
          {currentUrl && (
            isVideo ? (
              <video src={currentUrl} className="w-full h-full object-cover" muted loop playsInline autoPlay />
            ) : (
              <img src={currentUrl} alt={slot.label} className="w-full h-full object-cover" />
            )
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
          <h3 className="text-white font-bold text-sm">{slot.label}</h3>
          {savedFlash && <span className="text-xs text-green-400 font-semibold">Salvo ✓</span>}
        </div>
        <p className="text-[#0071e3] text-xs font-semibold mb-1">Tamanho recomendado: {slot.recommendedSize}</p>
        <p className="text-gray-400 text-xs mb-3 leading-relaxed">{slot.note}</p>

        <div className="flex flex-col sm:flex-row gap-2 mb-2">
          <input
            type="text"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSave()}
            placeholder={isVideo ? 'Colar link (URL) do novo vídeo (.mp4)...' : 'Colar link (URL) da nova imagem...'}
            className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#0071e3]"
          />
          <button onClick={handleUrlSave} className="bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold px-4 py-2 rounded-xl transition whitespace-nowrap active:scale-[0.98]">
            Usar link
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => fileInputRef.current?.click()} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-xl transition active:scale-[0.98]">
            Enviar do computador
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={isVideo ? 'video/*' : 'image/*'}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <button onClick={onReset} className="text-gray-400 hover:text-white text-xs font-medium px-3 py-1.5 rounded-xl transition active:scale-[0.98]">
            Restaurar padrão
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ImageAdmin() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const { images, setImage, resetImage, resetAll } = useSiteImages();

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  // Agrupa os slots (imagens e vídeos) pelo bloco/contexto onde aparecem no site
  const groups = ALL_SITE_MEDIA_SLOTS.reduce<Record<string, ImageSlot[]>>((acc, slot) => {
    (acc[slot.context] ||= []).push(slot);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <h1 className="text-white text-xl sm:text-2xl font-bold">Admin de Mídia — AirNext</h1>
          <button
            onClick={() => confirm('Restaurar TODAS as imagens e vídeos para o padrão original?') && resetAll()}
            className="text-red-400 hover:text-red-300 text-sm font-medium self-start sm:self-auto"
          >
            Restaurar tudo
          </button>
        </div>
        <p className="text-gray-400 text-sm mb-8 sm:mb-10 leading-relaxed">
          Cada bloco abaixo tem sua própria imagem ou vídeo — trocar um não afeta os outros, mesmo que
          seja do mesmo produto. É só colar um link ou enviar um arquivo.
        </p>

        <div className="space-y-10 sm:space-y-12">
          {Object.entries(groups).map(([context, slots]) => (
            <div key={context}>
              <h2 className="text-white text-base font-bold mb-4 pb-2 border-b border-white/10">{context}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {slots.map((slot) => (
                  <MediaSlotRow
                    key={slot.id}
                    slot={slot}
                    currentUrl={images[slot.id]}
                    onChange={(url) => setImage(slot.id, url)}
                    onReset={() => resetImage(slot.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
