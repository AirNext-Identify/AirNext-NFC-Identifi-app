import { useRef, useState } from 'react';
import { ALL_SITE_MEDIA_SLOTS, ImageSlot } from '../config/site-images';
import { useSiteImages } from '../hooks/useSiteImages';
import { isVideoUrl } from '../lib/media';
import { uploadSiteMedia } from '../lib/siteMedia';

// Troque essa senha por uma sua. É só uma trava simples para visitantes não
// acharem o atalho por acaso — não é segurança de verdade (o código roda no
// navegador). Se quiser algo mais sério, proteja essa rota no back-end.
const ADMIN_PASSWORD = 'airnext2026';
const SESSION_KEY = 'airnext_admin_unlocked';

// Agora os arquivos vão pro Supabase Storage (não mais base64 no localStorage),
// então o limite é só pra manter o site rápido — pode subir se precisar.
const MAX_IMAGE_MB = 8;
const MAX_VIDEO_MB = 50;

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
  onChange: (url: string) => Promise<void>;
  onReset: () => void;
}) {
  // Slots "flexíveis" (ex: "Veja o AirNext em ação") aceitam foto OU vídeo no
  // mesmo espaço — nesse caso, decide pelo conteúdo atual, não por um tipo fixo.
  const isVideo = slot.type === 'video' || (slot.flexibleMedia === true && isVideoUrl(currentUrl));
  const [urlDraft, setUrlDraft] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const flashSaved = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  };

  const handleUrlSave = async () => {
    if (!urlDraft.trim()) return;
    setErrorMsg('');
    try {
      await onChange(urlDraft.trim());
      setUrlDraft('');
      flashSaved();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao salvar.');
    }
  };

  const handleFile = async (file: File) => {
    // Em slots flexíveis, o tipo do ARQUIVO enviado decide o limite — não o
    // que já estava salvo ali antes.
    const fileIsVideo = slot.flexibleMedia ? file.type.startsWith('video') : isVideo;
    const maxMb = fileIsVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
    if (file.size > maxMb * 1024 * 1024) {
      alert(
        fileIsVideo
          ? `Esse vídeo tem mais de ${maxMb}MB. Comprima antes ou hospede em outro lugar (ex: YouTube, Vimeo) e cole o link.`
          : `Essa imagem tem mais de ${maxMb}MB. Comprima antes (ex: squoosh.app) ou cole uma URL já hospedada.`
      );
      return;
    }
    setErrorMsg('');
    setUploading(true);
    try {
      // Sobe o arquivo pro Supabase Storage (bucket "site-media") e salva a
      // URL pública na tabela — assim o arquivo fica disponível pra qualquer
      // visitante, em qualquer servidor, não só neste navegador.
      const { url, error } = await uploadSiteMedia(slot.id, file);
      if (error || !url) throw new Error(error || 'Falha no upload.');
      await onChange(url);
      flashSaved();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao enviar arquivo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div id={`slot-${slot.id}`} className="bg-[#121212] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 sm:gap-5 scroll-mt-24">
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
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            {slot.label}
            {slot.flexibleMedia && (
              <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#0071e3]/20 text-[#4da3ff]">
                Foto ou vídeo
              </span>
            )}
          </h3>
          {savedFlash && <span className="text-xs text-green-400 font-semibold">Salvo ✓</span>}
          {uploading && <span className="text-xs text-[#4da3ff] font-semibold">Enviando...</span>}
        </div>
        <p className="text-[#0071e3] text-xs font-semibold mb-1">Tamanho recomendado: {slot.recommendedSize}</p>
        <p className="text-gray-400 text-xs mb-3 leading-relaxed">{slot.note}</p>
        {errorMsg && <p className="text-red-400 text-xs mb-3">{errorMsg}</p>}

        <div className="flex flex-col sm:flex-row gap-2 mb-2">
          <input
            type="text"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSave()}
            placeholder={
              slot.flexibleMedia
                ? 'Colar link (URL) da foto ou do vídeo...'
                : isVideo ? 'Colar link (URL) do novo vídeo (.mp4)...' : 'Colar link (URL) da nova imagem...'
            }
            className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#0071e3]"
          />
          <button onClick={handleUrlSave} disabled={uploading} className="bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition whitespace-nowrap active:scale-[0.98]">
            Usar link
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-white/5 hover:bg-white/10 disabled:opacity-50 border border-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-xl transition active:scale-[0.98]">
            {uploading ? 'Enviando...' : 'Enviar do computador'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={slot.flexibleMedia ? 'image/*,video/*' : isVideo ? 'video/*' : 'image/*'}
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
  const { images, setImage, resetImage, resetAll, loading } = useSiteImages();

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-gray-400 text-sm">Carregando imagens...</p>
      </div>
    );
  }

  // Agrupa os slots (imagens e vídeos) pelo bloco/contexto onde aparecem no site
  const groups = ALL_SITE_MEDIA_SLOTS.reduce<Record<string, ImageSlot[]>>((acc, slot) => {
    (acc[slot.context] ||= []).push(slot);
    return acc;
  }, {});

  // Atalhos de vídeo — todo slot que HOJE contém um vídeo (fixo tipo "video"
  // ou um slot flexível onde o arquivo salvo é um vídeo), pra achar rápido
  // sem precisar rolar a página toda.
  const videoSlots = ALL_SITE_MEDIA_SLOTS.filter(
    (slot) => slot.type === 'video' || (slot.flexibleMedia === true && isVideoUrl(images[slot.id]))
  );

  // Atalhos da seção "Veja o AirNext em ação" — TODOS os slots que aceitam
  // foto OU vídeo (independente do que está salvo ali agora), pra ficar fácil
  // achar onde trocar por um vídeo, mesmo que hoje esteja com uma foto.
  const flexibleMediaSlots = ALL_SITE_MEDIA_SLOTS.filter((slot) => slot.flexibleMedia === true);

  const scrollToSlot = (id: string) => {
    document.getElementById(`slot-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

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
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          Cada bloco abaixo tem sua própria imagem ou vídeo — trocar um não afeta os outros, mesmo que
          seja do mesmo produto. É só colar um link ou enviar um arquivo.
        </p>

        {flexibleMediaSlots.length > 0 && (
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6">
            <h2 className="text-white text-sm font-bold mb-1">Vídeos de "Veja o AirNext em ação"</h2>
            <p className="text-gray-400 text-xs mb-3 leading-relaxed">
              Esses cards aceitam foto OU vídeo. Clique num deles pra ir direto lá e enviar um vídeo,
              mesmo que hoje ainda esteja com uma foto.
            </p>
            <div className="flex flex-wrap gap-2">
              {flexibleMediaSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => scrollToSlot(slot.id)}
                  className="flex items-center gap-1.5 bg-[#0071e3]/10 hover:bg-[#0071e3]/20 border border-[#0071e3]/30 text-[#4da3ff] text-xs font-semibold px-3 py-1.5 rounded-full transition active:scale-[0.98]"
                >
                  🎬 {slot.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {videoSlots.length > 0 && (
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 sm:p-5 mb-8 sm:mb-10">
            <h2 className="text-white text-sm font-bold mb-3">Atalhos de vídeos do site</h2>
            <div className="flex flex-wrap gap-2">
              {videoSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => scrollToSlot(slot.id)}
                  className="flex items-center gap-1.5 bg-[#0071e3]/10 hover:bg-[#0071e3]/20 border border-[#0071e3]/30 text-[#4da3ff] text-xs font-semibold px-3 py-1.5 rounded-full transition active:scale-[0.98]"
                >
                  ▶ {slot.label}
                </button>
              ))}
            </div>
          </div>
        )}

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
