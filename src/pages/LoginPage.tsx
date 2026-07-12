import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo';
import GoogleButton from '../components/auth/GoogleButton';
import RocketMascot from '../components/RocketMascot';

export default function LoginPage() {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('');
  const [show, setShow] = useState(false); const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const { login, loginWithGoogle, blockedReason, clearBlockedReason } = useAuth(); const nav = useNavigate();

  // Se a sessão foi encerrada à força (conta bloqueada/suspensa detectada
  // após login social ou ao restaurar uma sessão existente), mostra o
  // motivo aqui assim que o usuário cair de volta na tela de login.
  useEffect(() => {
    if (blockedReason) {
      setError(blockedReason);
      clearBlockedReason();
    }
  }, [blockedReason, clearBlockedReason]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await login(email, pw);
      const role = data?.user?.app_metadata?.role;
      nav(role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err: any) {
      setError(err?.blocked ? err.message : 'Email ou senha incorretos.');
    } finally {
      setBusy(false);
    }
  };
  const submitGoogle = async () => {
    setError(''); setGoogleBusy(true);
    try { await loginWithGoogle(); }
    catch { setError('Não foi possível continuar com o Google. Tente novamente.'); setGoogleBusy(false); }
  };
  const inp = "w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 focus:border-[#3B82F6]/40 transition-all text-sm";
  const inpStyle: React.CSSProperties = { color: '#ffffff' };
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
          <h1 className="text-2xl font-bold text-white">Bem-vindo de volta</h1>
          <p className="mt-1.5 text-sm text-zinc-300">Entre na sua conta AirNext</p>
        </div>
        <div className="auth-card slide-up p-8">
          <GoogleButton onClick={submitGoogle} busy={googleBusy} label="Entrar com o Google" />

          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">ou entre com email</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">{error}</div>}
            <div>
              <label className="block text-xs font-medium text-zinc-200 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className={inp+" pl-10"} style={inpStyle} placeholder="seu@email.com" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-200 mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} required className={inp + " pl-10 pr-10"} style={inpStyle} placeholder="Mínimo 6 caracteres" />
                <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 text-sm hover:scale-[1.015] active:scale-[0.99] shadow-lg shadow-[#2563EB]/30"
              style={{ background: 'linear-gradient(135deg, #2563EB, #3B82F6)' }}
            >
              {busy?<><Loader2 className="h-4 w-4 animate-spin"/>Entrando...</>:<>Entrar <ArrowRight className="h-4 w-4"/></>}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-zinc-300">Não tem conta? <Link to="/register" className="font-semibold text-[#60A5FA] hover:text-[#93c5fd] transition-colors">Cadastre-se grátis</Link></p>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
          <ShieldCheck className="h-3.5 w-3.5" /> Conexão segura e criptografada
        </p>
      </div>
    </div>
  );
}
