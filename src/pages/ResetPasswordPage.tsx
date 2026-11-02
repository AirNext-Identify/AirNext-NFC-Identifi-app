import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, ArrowRight, Check } from 'lucide-react';
import { AuthShell, AuthError } from '../components/auth/AuthShell';
import { supabase } from '../lib/supabase';

type Phase = 'checking' | 'ready' | 'invalid' | 'done';

export default function ResetPasswordPage() {
  const [phase, setPhase] = useState<Phase>('checking');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  // O link do e-mail abre esta página já com uma sessão de recuperação (o Supabase lê o token da URL).
  useEffect(() => {
    let cancelled = false;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'PASSWORD_RECOVERY' || (session && event === 'SIGNED_IN')) setPhase((p) => (p === 'done' ? p : 'ready'));
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) setPhase((p) => (p === 'checking' ? 'ready' : p));
    });
    const t = setTimeout(() => {
      if (!cancelled) setPhase((p) => (p === 'checking' ? 'invalid' : p));
    }, 4000);
    return () => { cancelled = true; clearTimeout(t); sub.subscription.unsubscribe(); };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (pw.length < 6) return setError('A senha deve ter no mínimo 6 caracteres.');
    if (pw !== pw2) return setError('As senhas não coincidem.');
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password: pw });
      if (err) throw err;
      setPhase('done');
    } catch (err: any) {
      const low = String(err?.message || '').toLowerCase();
      setError(
        err?.code === 'same_password' || low.includes('different from the old')
          ? 'A nova senha precisa ser diferente da atual.'
          : err?.code === 'weak_password' || low.includes('password')
            ? 'A senha não atende às regras de segurança. Use uma senha mais forte.'
            : 'Não foi possível salvar a nova senha. Peça um novo link e tente de novo.'
      );
    } finally {
      setBusy(false);
    }
  };

  if (phase === 'checking') {
    return (
      <AuthShell title="Redefinir senha" subtitle="Validando seu link..." showForgot={false}>
        <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-[#4aa3ff]" /></div>
      </AuthShell>
    );
  }

  if (phase === 'invalid') {
    return (
      <AuthShell title="Link inválido ou expirado" subtitle="Peça um novo link para criar sua senha" showForgot={false}>
        <div className="space-y-3 text-center">
          <Link to="/recuperar-senha" className="apple-btn">Pedir novo link <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/login" className="block w-full text-sm text-[#a1a1a6]">Voltar para o login</Link>
        </div>
      </AuthShell>
    );
  }

  if (phase === 'done') {
    return (
      <AuthShell title="Senha atualizada" subtitle="Sua nova senha já está valendo" showForgot={false} showSupport={false}>
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#30d158]/15 ring-1 ring-[#30d158]/40">
            <Check className="h-8 w-8 text-[#30d158]" />
          </div>
          <button type="button" onClick={() => nav('/dashboard', { replace: true })} className="apple-btn">
            Ir para minha conta <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Nova senha" subtitle="Crie uma senha forte para sua conta AirNext" showForgot={false}>
      <form onSubmit={submit} className="space-y-4">
        {error && <AuthError>{error}</AuthError>}
        <div>
          <label className="apple-label" htmlFor="reset-pw">Nova senha</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#636366]" />
            <input id="reset-pw" type={show ? 'text' : 'password'} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} className="apple-input pl-11 pr-11" placeholder="Mínimo de 6 caracteres" />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#636366] hover:text-white transition-colors">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="apple-label" htmlFor="reset-pw2">Confirmar nova senha</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#636366]" />
            <input id="reset-pw2" type={show ? 'text' : 'password'} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} required className="apple-input pl-11" placeholder="Repita a senha" />
          </div>
        </div>
        <button type="submit" disabled={busy} className="apple-btn mt-2">
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</> : <>Salvar nova senha <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>
    </AuthShell>
  );
}
