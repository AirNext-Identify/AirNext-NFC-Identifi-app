import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import {
  User as UserIcon, Mail, Phone, ChevronDown, Loader2, Check, ShieldCheck, KeyRound,
  FileText, LifeBuoy, LogOut, Info, CalendarDays,
} from 'lucide-react';
import { MANAGER_OPTIONS, maskPhone, isValidPhone, parseAge, isMinor, isAccountComplete } from '../../lib/account';

/** Minha conta — informações de contato e de quem gerencia, em visual Apple. */
export default function Account() {
  const { user, updateAccount, sendPasswordReset, logout } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [managedBy, setManagedBy] = useState('self');
  const [managerName, setManagerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [resetBusy, setResetBusy] = useState(false);

  // Carrega os dados atuais da conta (uma vez por usuário).
  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setPhone(maskPhone(user.phone || ''));
    setAge(user.age != null ? String(user.age) : '');
    setManagedBy(user.managedBy || 'self');
    setManagerName(user.managerName || '');
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const ageNum = parseAge(age);
  const minor = isMinor(ageNum);

  const dirty = useMemo(() => {
    if (!user) return false;
    return (
      firstName.trim() !== (user.firstName || '') ||
      lastName.trim() !== (user.lastName || '') ||
      phone.replace(/\D/g, '') !== (user.phone || '') ||
      (ageNum ?? null) !== (user.age ?? null) ||
      managedBy !== (user.managedBy || 'self') ||
      managerName.trim() !== (user.managerName || '')
    );
  }, [user, firstName, lastName, phone, ageNum, managedBy, managerName]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim()) return setError('Informe seu nome.');
    if (!lastName.trim()) return setError('Informe seu sobrenome.');
    if (!isValidPhone(phone)) return setError('Informe um telefone válido com DDD, ex.: (47) 99999-9999.');
    if (age.trim() !== '' && ageNum === null) return setError('Idade inválida. Use um número entre 0 e 120 ou deixe em branco.');
    if (managedBy !== 'self' && !managerName.trim()) return setError('Informe o nome de quem gerencia a conta.');
    setSaving(true);
    const r = await updateAccount({ firstName, lastName, phone, age: ageNum, managedBy, managerName });
    setSaving(false);
    if (!r.ok) return setError('Não foi possível salvar agora. Tente novamente.');
    toast.show('Informações da conta salvas', 'success');
  };

  const resetPw = async () => {
    setResetBusy(true);
    const r = await sendPasswordReset();
    setResetBusy(false);
    toast.show(r.ok ? 'Enviamos um link para o seu e-mail.' : 'Não foi possível enviar o e-mail agora.', r.ok ? 'success' : 'info');
  };

  if (!user) return null;
  const complete = isAccountComplete(user);
  const initials = `${(user.firstName || user.name || '?').charAt(0)}${(user.lastName || '').charAt(0)}`.toUpperCase();

  const field = 'apple-input';
  const card = 'rounded-[28px] bg-[#1c1c1e]/70 border border-white/8 p-5 sm:p-7';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-gradient-to-b from-[#2997ff] to-[#0071e3] flex items-center justify-center text-white text-2xl font-semibold shadow-lg shadow-[#0071e3]/30">
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white truncate">{user.name || 'Minha conta'}</h1>
          <p className="text-sm text-[#a1a1a6] truncate">{user.email}</p>
        </div>
      </div>

      {!complete && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#0071e3]/40 bg-[#0071e3]/10 p-4">
          <Info className="h-5 w-5 text-[#2997ff] shrink-0 mt-0.5" />
          <p className="text-sm text-[#cfe6ff]">Complete seu nome, sobrenome e telefone para facilitar o suporte e a recuperação da sua conta.</p>
        </div>
      )}

      <form onSubmit={save} className="space-y-6" noValidate>
        {/* Dados pessoais */}
        <section className={card}>
          <h2 className="text-lg font-semibold text-white mb-1">Informações de contato</h2>
          <p className="text-sm text-[#a1a1a6] mb-5">Esses dados são da conta e não aparecem nos seus perfis públicos.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="apple-label" htmlFor="ac-first">Nome</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#636366]" />
                <input id="ac-first" className={`${field} pl-11`} value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" />
              </div>
            </div>
            <div>
              <label className="apple-label" htmlFor="ac-last">Sobrenome</label>
              <input id="ac-last" className={field} value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name" />
            </div>
            <div>
              <label className="apple-label" htmlFor="ac-phone">Telefone / WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#636366]" />
                <input id="ac-phone" className={`${field} pl-11`} inputMode="tel" value={phone} onChange={e => setPhone(maskPhone(e.target.value))} placeholder="(47) 99999-9999" autoComplete="tel-national" />
              </div>
            </div>
            <div>
              <label className="apple-label" htmlFor="ac-age">Idade <span className="text-[#636366]">(opcional)</span></label>
              <div className="relative">
                <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#636366]" />
                <input id="ac-age" type="number" inputMode="numeric" min={0} max={120} className={`${field} pl-11`} value={age} onChange={e => setAge(e.target.value.slice(0, 3))} placeholder="Ex.: 28" />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="apple-label" htmlFor="ac-email">E-mail de acesso</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#636366]" />
              <input id="ac-email" className={`${field} pl-11 opacity-60 cursor-not-allowed`} value={user.email} readOnly />
            </div>
            <p className="mt-1.5 text-[11px] text-[#636366]">Para trocar o e-mail, fale com o suporte.</p>
          </div>
          {minor && (
            <p className="mt-4 flex items-start gap-2 text-[13px] text-[#9ccbff]">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              Menores de 18 anos devem ter a conta administrada por um responsável legal. Indique abaixo quem gerencia.
            </p>
          )}
        </section>

        {/* Quem gerencia */}
        <section className={card}>
          <h2 className="text-lg font-semibold text-white mb-1">Quem gerencia</h2>
          <p className="text-sm text-[#a1a1a6] mb-5">Indique quem cuida desta conta e dos perfis vinculados.</p>
          <div className="grid gap-2">
            {MANAGER_OPTIONS.map(o => {
              const on = managedBy === o.id;
              return (
                <button
                  type="button"
                  key={o.id}
                  onClick={() => setManagedBy(o.id)}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${on ? 'border-[#0071e3] bg-[#0071e3]/10' : 'border-white/8 bg-white/[0.02] hover:border-white/20'}`}
                >
                  <span className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${on ? 'bg-[#0071e3] border-[#0071e3]' : 'border-[#48484a]'}`}>
                    {on && <Check className="h-3 w-3 text-white" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-white">{o.label}</span>
                    <span className="block text-xs text-[#a1a1a6]">{o.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {managedBy !== 'self' && (
            <div className="mt-4">
              <label className="apple-label" htmlFor="ac-manager">Nome de quem gerencia</label>
              <input id="ac-manager" className={field} value={managerName} onChange={e => setManagerName(e.target.value)} placeholder="Nome completo" />
            </div>
          )}
        </section>

        {error && <div role="alert" className="rounded-2xl bg-[#ff453a]/10 border border-[#ff453a]/25 px-4 py-3 text-sm text-[#ff6961]">{error}</div>}

        <div className="flex items-center justify-end gap-3 sticky bottom-4">
          <button type="submit" disabled={saving || !dirty} className="apple-btn !w-auto px-8 shadow-xl shadow-black/40">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</> : 'Salvar alterações'}
          </button>
        </div>
      </form>

      {/* Segurança e documentos */}
      <section className={card}>
        <h2 className="text-lg font-semibold text-white mb-4">Segurança e privacidade</h2>
        <div className="divide-y divide-white/8">
          <button onClick={resetPw} disabled={resetBusy} className="w-full flex items-center gap-3 py-3.5 text-left hover:opacity-90 disabled:opacity-60">
            <KeyRound className="h-5 w-5 text-[#2997ff]" />
            <span className="flex-1"><span className="block text-sm font-medium text-white">Alterar senha</span><span className="block text-xs text-[#a1a1a6]">Enviamos um link de redefinição para o seu e-mail</span></span>
            {resetBusy && <Loader2 className="h-4 w-4 animate-spin text-[#a1a1a6]" />}
          </button>
          <Link to="/politica-de-privacidade" className="flex items-center gap-3 py-3.5 hover:opacity-90">
            <ShieldCheck className="h-5 w-5 text-[#2997ff]" />
            <span className="flex-1 text-sm font-medium text-white">Política de Privacidade</span>
          </Link>
          <Link to="/termos-de-uso" className="flex items-center gap-3 py-3.5 hover:opacity-90">
            <FileText className="h-5 w-5 text-[#2997ff]" />
            <span className="flex-1 text-sm font-medium text-white">Termos de Uso</span>
          </Link>
          <Link to="/dashboard/suporte" className="flex items-center gap-3 py-3.5 hover:opacity-90">
            <LifeBuoy className="h-5 w-5 text-[#2997ff]" />
            <span className="flex-1"><span className="block text-sm font-medium text-white">Suporte</span><span className="block text-xs text-[#a1a1a6]">Alterar e-mail, exportar ou excluir seus dados</span></span>
          </Link>
          <button onClick={() => { logout(); nav('/'); }} className="w-full flex items-center gap-3 py-3.5 text-left text-[#ff6961] hover:opacity-90">
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Sair da conta</span>
          </button>
        </div>
      </section>
    </div>
  );
}
