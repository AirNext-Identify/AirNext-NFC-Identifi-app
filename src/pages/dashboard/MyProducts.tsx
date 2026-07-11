import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CreditCard, Watch, KeyRound, PawPrint, Tag, Wifi, Eye, Plus, ExternalLink, Calendar } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const PT: Record<string, string> = { CARTAO: 'Cartão NFC', PULSEIRA: 'Pulseira NFC', CHAVEIRO: 'Chaveiro NFC', PLAQUINHA_PET: 'Plaquinha Pet', ETIQUETA: 'Etiqueta NFC' };
const PI: Record<string, React.ElementType> = { CARTAO: CreditCard, PULSEIRA: Watch, CHAVEIRO: KeyRound, PLAQUINHA_PET: PawPrint, ETIQUETA: Tag };
const CN: Record<string, string> = { PERSONAL: 'Personal', BUSINESS: 'Business', PET: 'Pet', KIDS: 'Kids', SENIOR: 'Senior', TEA: 'TEA' };
const SS: Record<string, string> = { ATIVO: 'bg-emerald-500/20 text-emerald-400', EXPIRADO: 'bg-red-500/20 text-red-400', BLOQUEADO: 'bg-zinc-500/20 text-zinc-400' };

function getName(p: any): string {
  if (!p.profileData) return PT[p.productType] || '—';
  return p.profileData.nome || p.profileData.nomeEmpresa || '—';
}

export default function MyProducts() {
  const { products, visits } = useAuth();

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Meus Produtos</h1>
          <p className="text-zinc-500 text-sm mt-0.5">1 Produto = 1 Perfil</p>
        </div>
        <Link to="/ativar" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors">
          <Plus className="h-4 w-4" /> Ativar Novo
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Wifi className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-white mb-2">Nenhum produto</h3>
          <p className="text-zinc-500 text-sm">Ative um produto para criar seu perfil.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map(p => {
            const Icon = PI[p.productType ?? ''] || Wifi;
            const url = p.slug ? `${window.location.origin}/u/${p.slug}` : null;
            const productVisits = visits.filter(v => v.productId === p.id);
            const views = productVisits.length;
            const nfcTaps = productVisits.filter(v => v.type === 'nfc').length;
            const qrScans = productVisits.filter(v => v.type === 'qr').length;

            return (
              <div key={p.id} className="glass rounded-xl overflow-hidden hover:bg-white/[0.04] transition-all">
                <div className="bg-gradient-to-r from-brand-600/30 to-purple-600/30 p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {p.profileData?.foto ? (
                      <img src={p.profileData.foto} alt={getName(p)} className="h-full w-full object-cover" />
                    ) : (
                      <Icon className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{getName(p)}</p>
                    <p className="text-white/50 text-xs">{PT[p.productType ?? ''] ?? '—'}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${SS[p.status ?? ''] || 'text-zinc-400'}`}>
                    {p.status === 'ATIVO' ? 'Ativo' : p.status ?? '—'}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[{ l: 'Views', v: views }, { l: 'NFC', v: nfcTaps }, { l: 'QR', v: qrScans }].map(s => (
                      <div key={s.l} className="bg-white/[0.03] rounded-lg py-2">
                        <p className="text-base font-bold text-white">{s.v}</p>
                        <p className="text-[10px] text-zinc-600">{s.l}</p>
                      </div>
                    ))}
                  </div>
                  {p.category && (
                    <p className="text-[11px] text-zinc-600">
                      Categoria: <span className="text-brand-400">{CN[p.category] ?? p.category}</span>
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-[11px] text-zinc-600">
                    <Calendar className="h-3 w-3" />
                    {p.createdAt && <span>Comprado: {p.createdAt}</span>}
                    {p.activatedAt && <span>· Ativado: {p.activatedAt}</span>}
                    {p.expiresAt && <span>· Expira: {p.expiresAt}</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-zinc-700 bg-white/[0.03] rounded-lg px-3 py-1.5">
                    <span className="truncate">Código: {p.activationCode ?? '—'}</span>
                  </div>
                  {url && (
                    <div className="flex items-center gap-3 pt-1">
                      <div className="bg-white p-1.5 rounded-lg">
                        <QRCodeSVG value={`${url}?via=qr`} size={48} bgColor="#fff" fgColor="#4f46e5" level="L" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <Link to={`/u/${p.slug}`} target="_blank" className="flex items-center gap-1.5 text-[11px] text-brand-400 font-medium hover:text-brand-300">
                          <ExternalLink className="h-3 w-3" /> Ver perfil
                        </Link>
                        <Link to={`/dashboard/perfil/${p.id}`} className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium hover:text-white">
                          <Eye className="h-3 w-3" /> Editar
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
