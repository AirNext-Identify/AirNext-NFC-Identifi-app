import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Loader2, ArrowRight, ShieldCheck, Eye, EyeOff, Check } from 'lucide-react';
import Logo from '../components/Logo';
import GoogleButton from '../components/auth/GoogleButton';
import RocketMascot from '../components/RocketMascot';

export default function RegisterPage() {
  const [name, setName] = useState(''); const [email, setEmail] = useState('');
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const { register, loginWithGoogle } = useAuth(); const nav = useNavigate();
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setError('');
    if (pw.length < 6) { setError('Senha deve ter no mínimo 6 caracteres.'); return; }
    if (pw !== pw2) { setError('As senhas não coincidem.'); return; }
    setBusy(true); const ok = await register(name, email, pw); setBusy(false);
    if (ok) nav('/ativar'); else setError('Email já cadastrado.');
  };
  const submitGoogle = async () => {
    setError(''); setGoogleBusy(true);
    try { await loginWithGoogle(); }
    catch { setError('Não foi possível continuar com o Google. Tente novamente.'); setGoogleBusy(false); }
  };
  const inp = "w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 focus:border-[#3B82F6]/40 transition-all text-sm";
  const inpStyle: React.CSSProperties = { color: '#ffffff' };
  const pwStrength = pw.length === 0 ? 0 : pw.length < 6 ? 1 : pw.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Fraca', 'Boa', 'Forte'][pwStrength];
  const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500'][pwStrength];
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fundo escuro limpo com identidade AirNext (sem efeito animado) +
          leve textura de pontos discreta. */}
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />

      {/* Mascote foguete sobrevoando a tela */}
      <RocketMascot />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-10 fade-up">
          <div className="inline-block mb-6"><Logo to="/login" size="lg" withTouchGlow /></div>
          <h1 className="text-2xl font-bold text-white">Crie sua conta</h1>
          <p className="mt-1.5 text-sm text-zinc-300">Comece a compartilhar em 3 minutos</p>
        </div>
        <div className="auth-card slide-up p-8">
          <GoogleButton onClick={submitGoogle} busy={googleBusy} label="Cadastrar com o Google" />

          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">ou cadastre-se com email</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-200 mb-1.5">Nome</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inp + " pl-10"} style={inpStyle} placeholder="Seu nome completo" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-200 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inp + " pl-10"} style={inpStyle} placeholder="seu@email.com" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-200 mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} required className={inp + " pl-10 pr-10"} style={inpStyle} placeholder="Mínimo 6 caracteres" />
                <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {pw.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className={`h-full ${strengthColor} transition-all duration-300`} style={{ width: `${pwStrength * 33.3}%` }} />
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-300">{strengthLabel}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-200 mb-1.5">Confirmar</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input type={show ? 'text' : 'password'} value={pw2} onChange={(e) => setPw2(e.target.value)} required className={inp + " pl-10 pr-10"} style={inpStyle} placeholder="Repita a senha" />
                {pw2.length > 0 && pw === pw2 && (
                  <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 text-sm hover:scale-[1.015] active:scale-[0.99] shadow-lg shadow-[#2563EB]/30"
              style={{ background: 'linear-gradient(135deg, #2563EB, #3B82F6)' }}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  Criar Conta Grátis <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-zinc-300">Já tem conta? <Link to="/login" className="font-semibold text-[#60A5FA] hover:text-[#93c5fd] transition-colors">Entrar</Link></p>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
          <ShieldCheck className="h-3.5 w-3.5" /> Conexão segura e criptografada
        </p>
      </div>
    </div>
  );
}
