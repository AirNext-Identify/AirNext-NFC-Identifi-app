import { useState } from 'react';
import ImageEditor from '../ImageEditor';
import { uploadProfileImage } from '../../lib/storage';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * ImageUploadEditor — substitui o uso direto de <ImageEditor onSave={dataUrl => ...}/>
 * quando o destino final é `profile_data.foto` / `profile_data.capa` / galeria.
 *
 * Mantém 100% da experiência de corte que já existe (ImageEditor), só troca o
 * que acontece no "Aplicar": em vez de devolver a imagem em base64, sobe pro
 * Supabase Storage e devolve a URL pública via onUploaded.
 *
 * COMO TROCAR (em Perfil.tsx e ProfileCustomizer.tsx):
 *
 *   - import ImageEditor from '../../components/ImageEditor';
 *   + import ImageUploadEditor from '../../components/upload/ImageUploadEditor';
 *
 *   <ImageEditor onSave={(dataUrl) => setField(key, dataUrl)} ... />
 *   <ImageUploadEditor onUploaded={(url) => setField(key, url)} ... />
 *
 * (mesmas props onCancel/title de antes — só onSave virou onUploaded)
 */
interface Props {
  onUploaded: (url: string) => void;
  onCancel: () => void;
  initialImage?: string;
  title?: string;
  aspect?: number;
  helperText?: string;
}

export default function ImageUploadEditor({ onUploaded, onCancel, initialImage, title, aspect, helperText }: Props) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (dataUrl: string) => {
    if (!user) return;
    setUploading(true);
    setError('');
    const { url, error: uploadError } = await uploadProfileImage(dataUrl, user.id, 'imagem');
    setUploading(false);
    if (uploadError || !url) {
      setError(uploadError || 'Falha ao enviar imagem. Tente novamente.');
      return;
    }
    onUploaded(url);
  };

  return (
    <>
      <ImageEditor onSave={handleSave} onCancel={onCancel} initialImage={initialImage} title={title} aspect={aspect} helperText={helperText} />
      {(uploading || error) && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center pointer-events-none">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-2.5 shadow-2xl pointer-events-auto">
            {uploading && <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />}
            <span className={`text-xs font-medium ${error ? 'text-red-400' : 'text-white'}`}>
              {error || 'Enviando imagem...'}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
