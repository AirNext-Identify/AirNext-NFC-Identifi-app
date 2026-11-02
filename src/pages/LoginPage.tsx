import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import GoogleButton from '../components/auth/GoogleButton';
import { AuthShell, AuthDivider, AuthError } from '../components/auth/AuthShell';

export default function LoginPage() {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('');
  const [show, setShow] = useState(false); const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const { login, loginWithGoogle, blockedReason, clearBlockedReason } = useAuth(); const nav = useNavigate();
  const [searchParams] = useSearchParams();
  // "next" chega de /n/:uuid ou /a/:code (NfcRedirect) quando o produto
  // ainda não foi ativado: leva de volta exatamente para /ativar/:code
  // depois do login, em vez de perder o código e mandar pro /dashboard.
  const next = searchParams.get('next');

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
      if (role === 'ADMIN') nav('/admin');
      else nav(next || '/dashboard');
    } catch (err: any) {
      const low = String(err?.message || '').toLowerCase();
      setError(
        err?.blocked ? err.message
        : (err?.code === 'email_not_confirmed' || low.includes('not confirmed'))
          ? 'Confirme seu e-mail antes de entrar: abra o e-mail que enviamos e toque no link de confirmação.'
          : 'Email ou senha incorretos.'
      );
    } finally {
      setBusy(false);
    }
  };
  const submitGoogle = async () => {
    setError(''); setGoogleBusy(true);
    try { await loginWithGoogle(); }
    catch { setError('Não foi possível continuar com o Google. Tente novamente.'); setGoogleBusy(false); }
  };
  return (
    <AuthShell title="Bem-vindo de volta" subtitle="Entre na sua conta AirNext">
      <GoogleButton onClick={submitGoogle} busy={googleBusy} label="Entrar com o Google" />
      <AuthDivider>ou entre com e-mail</AuthDivider>

      <form onSubmit={submit} className="space-y-4">
        {error && <AuthError>{error}</AuthError>}
        <div>
          <label className="apple-label" htmlFor="login-email">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#636366]" />
            <input id="login-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required className="apple-input pl-11" placeholder="seu@email.com" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="apple-label" htmlFor="login-pw">Senha</label>
            <Link to="/recuperar-senha" className="apple-link mb-1.5 text-[13px]">Esqueceu a senha?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#636366]" />
            <input id="login-pw" type={show ? 'text' : 'password'} autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} required className="apple-input pl-11 pr-11" placeholder="Sua senha" />
            <button type="button" onClick={() => setShow(v => !v)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#636366] hover:text-white transition-colors">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={busy} className="apple-btn mt-2">
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Entrando...</> : <>Entrar <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-[#a1a1a6]">
        Não tem conta?{' '}
        <Link to={next ? `/register?next=${encodeURIComponent(next)}` : '/register'} className="apple-link">Cadastre-se grátis</Link>
      </p>
    </AuthShell>
  );
}
