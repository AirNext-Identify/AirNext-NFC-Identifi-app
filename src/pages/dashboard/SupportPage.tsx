import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { 
  Search, MessageCircle, ChevronDown, ChevronUp, ExternalLink, 
  HelpCircle, Zap, Key, Settings, CreditCard, Shield, Wifi,
  AlertTriangle, Lightbulb, Trash2, X, CheckCircle2, Loader2,
  ArrowLeft, Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function UserCheck(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>;
}

const FAQ = [
  { q: 'Como ativar meu produto?', a: 'Após criar sua conta, vá em "Meus Produtos" no dashboard. Clique em "Ativar Produto" e insira o código AIR-XXXXXXXX que veio com seu produto NFC.', icon: Zap },
  { q: 'Onde encontro o código de ativação?', a: 'O código está na embalagem do produto ou no cartão que acompanha o NFC. Formato: AIR-XXXXXXXX.', icon: Key },
  { q: 'Como editar meu perfil?', a: 'No dashboard, clique em "Meus Perfis", selecione o produto e clique em "Editar". Um editor wizard com preview ao vivo será aberto.', icon: Settings },
  { q: 'Como funciona o QR Code?', a: 'Na página de edição do perfil, vá até a etapa "Publicar" para ver e baixar seu QR Code exclusivo.', icon: Wifi },
  { q: 'Posso deixar meu perfil privado?', a: 'Sim! Na etapa "Publicar" do editor de perfil, você pode escolher entre Público, Privado ou Oculto. Perfis privados só podem ser vistos por você.', icon: Shield },
  { q: 'O que é o Modo SOS?', a: 'O Modo SOS exibe informações de emergência no topo do perfil. Disponível para os tipos Pet, Kids, Senior e TEA. Ative na etapa "Modo SOS" do editor.', icon: AlertTriangle },
  { q: 'Como renovar minha assinatura?', a: 'Quando faltar menos de 30 dias, aparecerá um botão "Renovar" no dashboard. Clique e siga o processo de pagamento.', icon: CreditCard },
  { q: 'Posso ter mais de um perfil?', a: 'Sim! Cada produto NFC = 1 perfil. Para criar outro, basta comprar um novo produto e ativar com um novo código.', icon: UserCheck },
  { q: 'Como compartilhar meu perfil?', a: 'Copie o link (airnext.com/u/seu-codigo) ou use o botão de compartilhamento no dashboard. Também pode enviar o QR Code.', icon: ExternalLink },
  { q: 'Por que meu perfil não está salvando?', a: 'Verifique sua conexão com a internet. Após editar, clique em "Salvar" ou use o botão na última etapa "Publicar". O indicador "Salvo ✓" confirma o salvamento.', icon: Settings },
];

type SupportView = 'menu' | 'whatsapp' | 'report' | 'suggestion' | 'faq' | 'delete';

export default function SupportPage() {
  const { user, requestAccountDeletion } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [view, setView] = useState<SupportView>('menu');
  const [search, setSearch] = useState('');
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2 | 3>(1);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [reportText, setReportText] = useState('');
  const [suggestionText, setSuggestionText] = useState('');
  const [sending, setSending] = useState(false);

  const filtered = FAQ.filter(f =>
    f.q.toLowerCase().includes(search.toLowerCase()) ||
    f.a.toLowerCase().includes(search.toLowerCase())
  );

  const handleSendReport = async () => {
    if (!reportText.trim()) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 800));
    setSending(false);
    setReportText('');
    toast.show('Problema reportado! Em breve entraremos em contato. 🙏', 'success');
    setView('menu');
  };

  const handleSendSuggestion = async () => {
    if (!suggestionText.trim()) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 800));
    setSending(false);
    setSuggestionText('');
    toast.show('Sugestão enviada! Obrigado pelo feedback. ✨', 'success');
    setView('menu');
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'EXCLUIR CONTA') {
      toast.show('Digite exatamente "EXCLUIR CONTA" para confirmar.', 'error');
      return;
    }
    setDeleting(true);
    const result = await requestAccountDeletion();
    setDeleting(false);
    if (result.ok) {
      toast.show('Conta excluída. Até logo!', 'success');
      nav('/login');
    } else {
      toast.show(result.error || 'Erro ao excluir conta.', 'error');
    }
  };

  /* ─── VIEWS ────────────────────────────────────────── */
  if (view === 'faq') return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => setView('menu')} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-all">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold text-white">Perguntas Frequentes</h1>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
          placeholder="Buscar dúvida..." />
      </div>
      <div className="space-y-2">
        {filtered.map((f, i) => {
          const Icon = f.icon;
          const isOpen = openIdx === i;
          return (
            <div key={i} className="glass rounded-xl overflow-hidden">
              <button onClick={() => setOpenIdx(isOpen ? null : i)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-blue-400" />
                </div>
                <span className="flex-1 text-sm font-medium text-white">{f.q}</span>
                {isOpen ? <ChevronUp className="h-4 w-4 text-zinc-500 shrink-0" /> : <ChevronDown className="h-4 w-4 text-zinc-600 shrink-0" />}
              </button>
              {isOpen && <div className="px-4 pb-4 pl-16 text-sm text-zinc-400 leading-relaxed">{f.a}</div>}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="glass rounded-xl p-8 text-center">
            <HelpCircle className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">Nenhum resultado. Fale no WhatsApp.</p>
          </div>
        )}
      </div>
    </div>
  );

  if (view === 'report') return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('menu')} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-all">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold text-white">Reportar Problema</h1>
      </div>
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-xs text-red-300">Descreva o problema com o máximo de detalhes. Nossa equipe analisará e entrará em contato.</p>
        </div>
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Descrição do problema *</label>
          <textarea value={reportText} onChange={e => setReportText(e.target.value)}
            placeholder="Descreva o que aconteceu, em qual página e quando..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 resize-none min-h-[120px]" />
        </div>
        <button onClick={handleSendReport} disabled={sending || !reportText.trim()}
          className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Enviar Reporte
        </button>
      </div>
    </div>
  );

  if (view === 'suggestion') return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('menu')} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-all">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold text-white">Enviar Sugestão</h1>
      </div>
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-xs text-blue-300">Sua opinião nos ajuda a melhorar o produto. Obrigado por contribuir!</p>
        </div>
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Sua sugestão *</label>
          <textarea value={suggestionText} onChange={e => setSuggestionText(e.target.value)}
            placeholder="Descreva sua ideia ou melhoria..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none min-h-[120px]" />
        </div>
        <button onClick={handleSendSuggestion} disabled={sending || !suggestionText.trim()}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Enviar Sugestão
        </button>
      </div>
    </div>
  );

  if (view === 'delete') return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => { setView('menu'); setDeleteStep(1); setDeleteConfirm(''); }}
          className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-all">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold text-white">Excluir Conta</h1>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        {deleteStep === 1 && (
          <>
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
              <AlertTriangle className="h-8 w-8 text-red-400 mb-3" />
              <h2 className="text-base font-black text-white mb-2">⚠️ Ação Permanente</h2>
              <p className="text-sm text-red-300 leading-relaxed">A exclusão da sua conta é <strong>permanente e irreversível</strong>. Todos os seus dados serão apagados.</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">O que será excluído:</p>
              {['Sua conta e dados pessoais','Todos os perfis criados','Produtos vinculados','Histórico de acessos','Todas as configurações'].map(item => (
                <div key={item} className="flex items-center gap-2 p-2 bg-red-500/5 rounded-lg">
                  <X className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  <span className="text-xs text-zinc-300">{item}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setView('menu'); setDeleteStep(1); }}
                className="flex-1 py-3 rounded-xl border border-white/10 text-sm font-bold text-zinc-400 hover:text-white hover:border-white/20 transition-all">
                Cancelar
              </button>
              <button onClick={() => setDeleteStep(2)}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-bold text-white transition-all">
                Continuar →
              </button>
            </div>
          </>
        )}

        {deleteStep === 2 && (
          <>
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-400" />
              </div>
              <h2 className="text-base font-black text-white">Tem certeza absoluta?</h2>
              <p className="text-sm text-zinc-500 mt-2">Esta ação não pode ser desfeita.</p>
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
                Digite <span className="text-red-400 font-black">EXCLUIR CONTA</span> para confirmar
              </label>
              <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="EXCLUIR CONTA"
                className="w-full bg-red-500/5 border border-red-500/30 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/40" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteStep(1)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-sm font-bold text-zinc-400 hover:text-white hover:border-white/20 transition-all">
                ← Voltar
              </button>
              <button onClick={handleDelete}
                disabled={deleting || deleteConfirm !== 'EXCLUIR CONTA'}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-sm font-black text-white transition-all flex items-center justify-center gap-2">
                {deleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Excluindo...</> : <><Trash2 className="h-4 w-4" /> Excluir Conta</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  /* ─── MAIN MENU ─────────────────────────────────────── */
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="text-center">
        <h1 className="text-xl font-bold text-white">Central de Suporte</h1>
        <p className="text-zinc-500 text-sm mt-1">Como podemos ajudar você?</p>
      </div>

      {/* WhatsApp - destaque */}
      <a href="https://wa.me/5547996287761?text=Olá! Preciso de ajuda com a AirNext"
        target="_blank" rel="noopener noreferrer"
        className="glass rounded-2xl p-5 flex items-center gap-4 hover:bg-emerald-500/10 hover:border-emerald-500/20 border border-white/5 transition-all group block">
        <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/30 transition-colors">
          <MessageCircle className="h-6 w-6 text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-white text-sm">Falar com Suporte via WhatsApp</p>
          <p className="text-xs text-zinc-500 mt-0.5">Atendimento rápido e personalizado</p>
        </div>
        <ExternalLink className="h-4 w-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
      </a>

      {/* Options grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Perguntas Frequentes', icon: HelpCircle, desc: 'Respostas rápidas', color: 'text-blue-400', bg: 'bg-blue-500/10', action: () => setView('faq') },
          { label: 'Reportar Problema', icon: AlertTriangle, desc: 'Algo não está certo', color: 'text-red-400', bg: 'bg-red-500/10', action: () => setView('report') },
          { label: 'Enviar Sugestão', icon: Lightbulb, desc: 'Compartilhe ideias', color: 'text-amber-400', bg: 'bg-amber-500/10', action: () => setView('suggestion') },
          { label: 'Excluir Conta', icon: Trash2, desc: 'Remover permanentemente', color: 'text-rose-400', bg: 'bg-rose-500/10', action: () => setView('delete') },
        ].map(opt => (
          <button key={opt.label} onClick={opt.action}
            className="glass rounded-2xl p-4 flex flex-col gap-3 text-left hover:bg-white/[0.03] transition-all active:scale-98 border border-white/5">
            <div className={`h-10 w-10 rounded-xl ${opt.bg} flex items-center justify-center`}>
              <opt.icon className={`h-5 w-5 ${opt.color}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">{opt.label}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* User info */}
      {user && (
        <div className="glass rounded-2xl p-4 flex items-center gap-3 border border-white/5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-black text-sm">
            {user.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{user.name}</p>
            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
          </div>
          <span className="text-[9px] font-bold px-2 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
            {user.role}
          </span>
        </div>
      )}
    </div>
  );
}
