import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Phone, Loader2, ArrowRight, Eye, EyeOff, Check, ChevronDown, Info } from 'lucide-react';
import GoogleButton from '../components/auth/GoogleButton';
import { AuthShell, AuthDivider, AuthError } from '../components/auth/AuthShell';
import {
  ConsentCheckboxes,
  ConsentState,
  consentsRequiredOk,
} from '../components/legal/ConsentCheckboxes';
import { recordConsents } from '../lib/consents';
import { supabase } from '../lib/supabase';
import { MANAGER_OPTIONS, maskPhone, isValidPhone, parseAge, isMinor } from '../lib/account';

/** Traduz o erro do Supabase Auth numa mensagem clara (antes todo erro virava "e-mail já cadastrado"). */
function registerErrorMessage(err: any): string {
  const code = String(err?.code || '');
  const msg = String(err?.message || '');
  const low = msg.toLowerCase();
  if (code === 'user_already_exists' || low.includes('already registered'))
    return 'Este e-mail já está cadastrado. Entre na sua conta ou recupere a senha.';
  if (code === 'over_email_send_rate_limit' || low.includes('email rate limit'))
    return 'O limite de envio de e-mails foi atingido. Aguarde alguns minutos e tente de novo.';
  if (code === 'over_request_rate_limit' || err?.status === 429)
    return 'Muitas tentativas seguidas. Aguarde um pouco e tente novamente.';
  if (code === 'weak_password' || low.includes('password'))
    return 'A senha não atende às regras de segurança. Use uma senha mais forte (letras, números e símbolos).';
  if (code === 'email_address_invalid' || (low.includes('email') && low.includes('invalid')))
    return 'E-mail inválido. Confira o endereço digitado.';
  if (code === 'signup_disabled' || low.includes('signups not allowed'))
    return 'O cadastro por e-mail está desativado no momento. Use o Google ou fale com a AirNext.';
  if (low.includes('sending confirmation email') || low.includes('error sending'))
    return 'Não foi possível enviar o e-mail de confirmação. Tente de novo em alguns minutos.';
  if (low.includes('database error'))
    return 'Erro ao salvar a conta no servidor. Fale com a AirNext pelo WhatsApp.';
  return `Não foi possível criar a conta${msg ? ` (${msg})` : ''}.`;
}

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [managedBy, setManagedBy] = useState('self');
  const [managerName, setManagerName] = useState('');
  const [guardianOk, setGuardianOk] = useState(false);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  // Depois do cadastro sem sessão (conta exige confirmar o e-mail): e-mail para onde o link foi enviado.
  const [sentTo, setSentTo] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [consents, setConsents] = useState<ConsentState>({ privacy: false, terms: false, marketing: false });
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const { register, loginWithGoogle } = useAuth();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  // Preserva o "next" (ex.: /ativar/AIR-XXXXXXXX) vindo de /n/:uuid ou /a/:code.
  const next = searchParams.get('next');

  const ageNum = parseAge(age);
  const minor = isMinor(ageNum);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim()) return setError('Informe seu nome.');
    if (!lastName.trim()) return setError('Informe seu sobrenome.');
    if (!isValidPhone(phone)) return setError('Informe um telefone válido com DDD, ex.: (47) 99999-9999.');
    if (age.trim() !== '' && ageNum === null) return setError('Idade inválida. Use um número entre 0 e 120 ou deixe em branco.');
    if (managedBy !== 'self' && !managerName.trim()) return setError('Informe o nome de quem gerencia a conta.');
    if (minor && !guardianOk) return setError('Para menores de 18 anos é necessária a autorização de um responsável legal.');
    if (pw.length < 6) return setError('A senha deve ter no mínimo 6 caracteres.');
    if (pw !== pw2) return setError('As senhas não coincidem.');
    if (!consentsRequiredOk(consents)) return setError('Aceite a Política de Privacidade e os Termos de Uso para continuar.');

    setBusy(true);
    try {
      const data = await register(`${firstName.trim()} ${lastName.trim()}`, email, pw, {
        firstName, lastName, phone, age: ageNum, managedBy, managerName,
      }, { marketing: consents.marketing });
      // Com "confirmar e-mail" ligado, o Supabase não dá erro para e-mail já existente: devolve um usuário sem identidades.
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setError('Este e-mail já está cadastrado. Entre na sua conta ou recupere a senha.');
        return;
      }
      const userId = data?.user?.id;
      if (userId && data?.session) {
        await recordConsents(userId, [
          { type: 'privacy_policy', accepted: true },
          { type: 'terms_of_use', accepted: true },
          { type: 'marketing', accepted: consents.marketing },
        ]);
        nav(next || '/ativar');
        return;
      }
      // Sem sessão = a conta exige confirmação por e-mail. Guarda o aceite para gravar no primeiro login.
      try {
        sessionStorage.setItem(
          'airnext:pending_consents',
          JSON.stringify({ privacy: true, terms: true, marketing: consents.marketing, at: Date.now() })
        );
      } catch { /* sem sessionStorage: o aceite será pedido de novo no primeiro login */ }
      setSentTo(email.trim());
      setCooldown(60);
      setResendMsg('');
    } catch (err) {
      console.error('[register]', err);
      setError(registerErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submitGoogle = async () => {
    setError('');
    if (!consentsRequiredOk(consents)) {
      return setError('Aceite a Política de Privacidade e os Termos de Uso antes de continuar com o Google.');
    }
    setGoogleBusy(true);
    try {
      sessionStorage.setItem(
        'airnext:pending_consents',
        JSON.stringify({ privacy: true, terms: true, marketing: consents.marketing, at: Date.now() })
      );
      await loginWithGoogle();
    } catch {
      setError('Não foi possível continuar com o Google. Tente novamente.');
      setGoogleBusy(false);
    }
  };

  const pwStrength = pw.length === 0 ? 0 : pw.length < 6 ? 1 : pw.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Fraca', 'Boa', 'Forte'][pwStrength];
  const strengthColor = ['', 'bg-[#ff453a]', 'bg-[#ff9f0a]', 'bg-[#30d158]'][pwStrength];

  const resend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setResendMsg('');
    try {
      const { error: resendErr } = await supabase.auth.resend({ type: 'signup', email: sentTo, options: { emailRedirectTo: `${window.location.origin}/confirmado` } });
      if (resendErr) throw resendErr;
      setResendMsg('E-mail reenviado! Confira a caixa de entrada e o spam.');
      setCooldown(60);
    } catch (err) {
      console.error('[register:resend]', err);
      setResendMsg(registerErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  // Tela "confirme seu e-mail": aparece no lugar do formulário assim que a conta é criada.
  if (sentTo) {
    const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : '/login';
    return (
      <AuthShell title="Confirme seu e-mail" subtitle="Falta só um passo para ativar sua conta">
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0071e3]/15 ring-1 ring-[#0071e3]/40">
            <Mail className="h-8 w-8 text-[#4aa3ff]" />
          </div>
          <p className="text-[15px] leading-relaxed text-[#d1d1d6]">
            Enviamos um link de confirmação para<br />
            <strong className="break-all text-white">{sentTo}</strong>
          </p>
          <ol className="space-y-3 text-left text-[14px] text-[#a1a1a6]">
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[12px] font-semibold text-white">1</span>Abra o e-mail que enviamos (veja também o spam e as promoções).</li>
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[12px] font-semibold text-white">2</span>Toque no link para confirmar o seu e-mail.</li>
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[12px] font-semibold text-white">3</span>Pronto: você entra direto na sua conta AirNext.</li>
          </ol>
          {resendMsg && <p role="status" className="text-[13px] text-[#a1a1a6]">{resendMsg}</p>}
          <div className="space-y-3">
            <Link to={loginHref} className="apple-btn">Já confirmei, entrar <ArrowRight className="h-4 w-4" /></Link>
            <button type="button" onClick={resend} disabled={cooldown > 0 || resending} className="w-full text-sm text-[#4aa3ff] disabled:text-[#636366]">
              {resending ? 'Reenviando...' : cooldown > 0 ? `Reenviar e-mail (${cooldown}s)` : 'Não recebi, reenviar e-mail'}
            </button>
            <button type="button" onClick={() => { setSentTo(''); setResendMsg(''); }} className="w-full text-sm text-[#a1a1a6]">
              Usar outro e-mail
            </button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Crie sua conta" subtitle="Comece a compartilhar em poucos minutos" maxWidth="max-w-lg">
      <GoogleButton onClick={submitGoogle} busy={googleBusy} label="Cadastrar com o Google" />
      <AuthDivider>ou cadastre-se com e-mail</AuthDivider>

      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <AuthError>{error}</AuthError>}

        {/* Nome + sobrenome */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="apple-label" htmlFor="reg-first">Nome</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#636366]" />
              <input id="reg-first" type="text" autoComplete="given-name" value={firstName} onChange={e => setFirstName(e.target.value)} required className="apple-input pl-11" placeholder="Seu nome" />
            </div>
          </div>
          <div>
            <label className="apple-label" htmlFor="reg-last">Sobrenome</label>
            <input id="reg-last" type="text" autoComplete="family-name" value={lastName} onChange={e => setLastName(e.target.value)} required className="apple-input" placeholder="Seu sobrenome" />
          </div>
        </div>

        {/* Telefone + idade */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_150px] gap-4">
          <div>
            <label className="apple-label" htmlFor="reg-phone">Telefone / WhatsApp</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#636366]" />
              <input id="reg-phone" type="tel" inputMode="tel" autoComplete="tel-national" value={phone} onChange={e => setPhone(maskPhone(e.target.value))} required className="apple-input pl-11" placeholder="(47) 99999-9999" />
            </div>
          </div>
          <div>
            <label className="apple-label" htmlFor="reg-age">Idade <span className="text-[#636366]">(opcional)</span></label>
            <input id="reg-age" type="number" inputMode="numeric" min={0} max={120} value={age} onChange={e => setAge(e.target.value.slice(0, 3))} className="apple-input" placeholder="Ex.: 28" />
          </div>
        </div>

        {/* Menor de idade */}
        {minor && (
          <div className="rounded-2xl border border-[#0071e3]/40 bg-[#0071e3]/10 p-4">
            <p className="flex items-start gap-2 text-[13px] text-[#9ccbff]">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              Para menores de 18 anos, a conta deve ser criada e administrada por um responsável legal.
            </p>
            <label className="mt-3 flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={guardianOk} onChange={e => setGuardianOk(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0071e3]" />
              <span className="text-[13px] text-white">Tenho autorização do meu responsável legal para criar esta conta.</span>
            </label>
          </div>
        )}

        {/* Quem gerencia */}
        <div>
          <label className="apple-label" htmlFor="reg-manager">Quem vai gerenciar esta conta?</label>
          <div className="relative">
            <select id="reg-manager" value={managedBy} onChange={e => setManagedBy(e.target.value)} className="apple-input appearance-none pr-11">
              {MANAGER_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#636366]" />
          </div>
          <p className="mt-1.5 text-[11px] text-[#636366]">{MANAGER_OPTIONS.find(o => o.id === managedBy)?.hint}</p>
        </div>
        {managedBy !== 'self' && (
          <div>
            <label className="apple-label" htmlFor="reg-manager-name">Nome de quem gerencia</label>
            <input id="reg-manager-name" type="text" value={managerName} onChange={e => setManagerName(e.target.value)} className="apple-input" placeholder="Nome completo do responsável" />
          </div>
        )}

        <div className="h-px bg-white/8" />

        <div>
          <label className="apple-label" htmlFor="reg-email">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#636366]" />
            <input id="reg-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required className="apple-input pl-11" placeholder="seu@email.com" />
          </div>
        </div>

        <div>
          <label className="apple-label" htmlFor="reg-pw">Senha</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#636366]" />
            <input id="reg-pw" type={show ? 'text' : 'password'} autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} required className="apple-input pl-11 pr-11" placeholder="Mínimo 6 caracteres" />
            <button type="button" onClick={() => setShow(v => !v)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#636366] hover:text-white transition-colors">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {pw.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full ${strengthColor} transition-all duration-300`} style={{ width: `${pwStrength * 33.3}%` }} />
              </div>
              <span className="text-[10px] font-semibold text-[#a1a1a6]">{strengthLabel}</span>
            </div>
          )}
        </div>

        <div>
          <label className="apple-label" htmlFor="reg-pw2">Confirmar senha</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#636366]" />
            <input id="reg-pw2" type={show ? 'text' : 'password'} autoComplete="new-password" value={pw2} onChange={e => setPw2(e.target.value)} required className="apple-input pl-11 pr-11" placeholder="Repita a senha" />
            {pw2.length > 0 && pw === pw2 && <Check className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#30d158]" />}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          <ConsentCheckboxes value={consents} onChange={setConsents} variant="dark" />
        </div>

        <p className="text-[11px] leading-relaxed text-[#636366]">
          Usamos seu nome, telefone e idade para identificar a conta, dar suporte e proteger seus perfis. Saiba mais na{' '}
          <Link to="/politica-de-privacidade" className="apple-link">Política de Privacidade</Link>.
        </p>

        <button type="submit" disabled={busy || !consentsRequiredOk(consents)} className="apple-btn">
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Criando...</> : <>Criar conta grátis <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#a1a1a6]">
        Já tem conta?{' '}
        <Link to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'} className="apple-link">Entrar</Link>
      </p>
    </AuthShell>
  );
}
