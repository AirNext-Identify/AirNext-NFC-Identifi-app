import { useEffect, useState } from 'react';
import { Shield, Bell, Users, Database, Lock, Globe, Loader2, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SettingsViewProps {
  appUrl: string;
  onUpdateAppUrl: (url: string) => void | Promise<void>;
}

export function SettingsView({ appUrl, onUpdateAppUrl }: SettingsViewProps) {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <DomainSettingCard appUrl={appUrl} onUpdate={onUpdateAppUrl} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SettingCard title="Segurança" icon={Shield}>
          <ToggleRow label="Autenticação em dois fatores" description="Exigir 2FA para todos os administradores." />
          <ToggleRow label="Bloqueio automático" description="Bloquear sessão após 30 minutos de inatividade." defaultChecked />
        </SettingCard>

        <SettingCard title="Notificações" icon={Bell}>
          <ToggleRow label="Alertas de validade" description="Enviar notificações automáticas de produtos expirando." defaultChecked />
          <ToggleRow label="Relatórios diários" description="Receber resumo diário por email." />
        </SettingCard>

        <SettingCard title="Permissões" icon={Users}>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 p-3">
              <span className="text-zinc-300">Administrador</span>
              <span className="text-xs text-zinc-500">Acesso total</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 p-3">
              <span className="text-zinc-300">Suporte</span>
              <span className="text-xs text-zinc-500">Apenas visualização</span>
            </div>
          </div>
        </SettingCard>

        <SettingCard title="Integrações" icon={Database}>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 p-3">
              <span className="text-zinc-300">Supabase</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">Conectado</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 p-3">
              <span className="text-zinc-300">Stripe</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">Conectado</span>
            </div>
          </div>
        </SettingCard>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-zinc-500" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Logs administrativos</h3>
            <p className="text-xs text-zinc-500">Todas as ações administrativas são registradas e auditáveis.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800">
          <Icon className="h-4.5 w-4.5 text-zinc-400" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, description, defaultChecked }: { label: string; description: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
      <div>
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input type="checkbox" defaultChecked={defaultChecked} className="peer sr-only" />
        <div className="h-6 w-11 rounded-full bg-zinc-800 transition-colors peer-checked:bg-indigo-500" />
        <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
      </label>
    </div>
  );
}

/**
 * Card de configuração da URL base gravada nos chips NFC / QR Codes.
 * Existe pra quando o domínio da AirNext mudar no futuro — em vez de mexer
 * em código e fazer novo deploy, o admin troca aqui e todo produto gravado
 * a partir de agora já sai com a URL nova. Produtos já gravados antes da
 * troca continuam com a URL antiga gravada fisicamente no chip.
 */
function DomainSettingCard({ appUrl, onUpdate }: { appUrl: string; onUpdate: (url: string) => void | Promise<void> }) {
  const [value, setValue] = useState(appUrl);
  const [saving, setSaving] = useState(false);

  // Mantém o campo sincronizado se o valor real mudar (ex.: carregou do banco).
  useEffect(() => {
    setValue(appUrl);
  }, [appUrl]);

  const normalized = value.trim().replace(/\/$/, '');
  const isValid = (() => {
    try {
      // eslint-disable-next-line no-new
      new URL(normalized);
      return true;
    } catch {
      return false;
    }
  })();
  const isDirty = normalized !== appUrl.trim().replace(/\/$/, '');

  const handleSave = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    await onUpdate(normalized);
    setSaving(false);
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800">
          <Globe className="h-4.5 w-4.5 text-zinc-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">URL de gravação dos chips NFC</h3>
          <p className="text-xs text-zinc-500">Domínio usado para montar o link gravado em cada chip/QR Code novo.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://seu-dominio.com"
          className="h-10 w-full flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700"
        />
        <button
          onClick={handleSave}
          disabled={!isValid || !isDirty || saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {!isValid && value.length > 0 ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
          <AlertTriangle className="h-3.5 w-3.5" /> URL inválida. Use o formato https://seu-dominio.com
        </p>
      ) : (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          Exemplo do que será gravado: <span className="text-zinc-400">{`${normalized || 'https://seu-dominio.com'}/n/uuid-do-produto`}</span>
        </p>
      )}

      <p className="mt-3 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs text-yellow-300/90">
        Trocar essa URL só afeta chips gravados <strong>a partir de agora</strong>. Chips já gravados fisicamente continuam
        apontando pro domínio antigo — regrave-os no Programador NFC se precisar migrar.
      </p>
    </div>
  );
}
