import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { AuthShell, AuthError } from '../components/auth/AuthShell';
import { supabase } from '../lib/supabase';

function resetErrorMessage(err: any): string {
  const code = String(err?.code || '');
  const low = String(err?.message || '').toLowerCase();
  if (code === 'over_email_send_rate_limit' || low.includes('email rate limit'))
    return 'Muitos e-mails enviados agora. Aguarde alguns minutos e tente de novo.';
  if (code === 'over_request_rate_limit' || err?.status === 429)
    return 'Muitas tentativas seguidas. Aguarde um pouco e tente novamente.';
  if (code === 'email_address_invalid' || (low.includes('email') && low.includes('invalid')))
    return 'E-mail inválido. Confira o endereço digitado.';
  return 'Não foi possível enviar o e-mail agora. Tente novamente em instantes.';
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async (target: string) => {
    setError('');
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(target, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      if (err) throw err;
      setSentTo(target);
      setCooldown(60);
    } catch (err) {
      console.error('[forgot-password]', err);
      setError(resetErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = email.trim();
    if (!v) return setError('Informe seu e-mail.');
    void send(v);
  };

  if (sentTo) {
    return (
      <AuthShell title="Verifique seu e-mail" subtitle="Enviamos as instruções para redefinir a senha" showForgot={false}>
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0071e3]/15 ring-1 ring-[#0071e3]/40">
            <Check className="h-8 w-8 text-[#4aa3ff]" />
          </div>
          <p className="text-[15px] leading-relaxed text-[#d1d1d6]">
            Se existir uma conta para<br />
            <strong className="break-all text-white">{sentTo}</strong>,<br />
            você receberá um e-mail com o botão para criar uma nova senha.
          </p>
          <p className="text-[13px] text-[#8e8e93]">Não achou? Veja também o spam e as promoções.</p>
          {error && <AuthError>{error}</AuthError>}
          <div className="space-y-3">
            <Link to="/login" className="apple-btn">Voltar para o login <ArrowRight className="h-4 w-4" /></Link>
            <button type="button" onClick={() => send(sentTo)} disabled={cooldown > 0 || busy} className="w-full text-sm text-[#4aa3ff] disabled:text-[#636366]">
              {busy ? 'Reenviando...' : cooldown > 0 ? `Reenviar e-mail (${cooldown}s)` : 'Não recebi, reenviar e-mail'}
            </button>
            <button type="button" onClick={() => { setSentTo(''); setError(''); }} className="w-full text-sm text-[#a1a1a6]">
              Usar outro e-mail
            </button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Recuperar senha" subtitle="Informe seu e-mail e enviaremos um link para criar uma nova senha" showForgot={false}>
      <form onSubmit={submit} className="space-y-4">
        {error && <AuthError>{error}</AuthError>}
        <div>
          <label className="apple-label" htmlFor="forgot-email">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#636366]" />
            <input id="forgot-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="apple-input pl-11" placeholder="seu@email.com" />
          </div>
        </div>
        <button type="submit" disabled={busy} className="apple-btn mt-2">
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Enviando...</> : <>Enviar link <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-[#a1a1a6]">
        <Link to="/login" className="apple-link inline-flex items-center gap-1.5"><ArrowLeft className="h-3.5 w-3.5" />Voltar para o login</Link>
      </p>
    </AuthShell>
  );
}
