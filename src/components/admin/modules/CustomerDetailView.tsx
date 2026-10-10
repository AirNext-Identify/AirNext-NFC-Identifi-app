import { useState } from 'react';
import {
  ArrowLeft,
  Edit3,
  Lock,
  Unlock,
  PauseCircle,
  PlayCircle,
  Trash2,
  Mail,
  MessageCircle,
  Bell,
  Save,
  CreditCard,
  Activity,
  Clock,
  BellRing,
  BarChart3,
  RefreshCw,
  History,
  LogIn,
  StickyNote,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/admin/ui/Badge';
import { Modal } from '@/components/admin/ui/Modal';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { cn, formatCurrency, formatDate, formatDateTime, getInitials, getValidityStatus } from '@/lib/adminUtils';
import type { Customer, CustomerStatus, Product, Notification, Renewal, LogEntry, AdminVisit } from '@/types/admin';

interface CustomerDetailViewProps {
  customer: Customer;
  products: Product[];
  notifications: Notification[];
  renewals: Renewal[];
  logs: LogEntry[];
  visits: AdminVisit[];
  onBack: () => void;
  onUpdate: (id: string, data: Partial<Customer>) => void;
  onChangeStatus: (id: string, status: CustomerStatus) => void;
  onDelete: (id: string) => void;
  onNotify: (customer: Customer) => void;
  onAddNote: (id: string, note: string) => void;
  onDeleteNotification: (id: string) => void;
}

const tabs = [
  { id: 'overview', label: 'Visão geral', icon: BarChart3 },
  { id: 'products', label: 'Produtos ativados', icon: CreditCard },
  { id: 'history', label: 'Histórico completo', icon: History },
  { id: 'logs', label: 'Logs', icon: Activity },
  { id: 'activations', label: 'Ativações', icon: Zap },
  { id: 'renewals', label: 'Renovações', icon: RefreshCw },
  { id: 'notifications', label: 'Notificações', icon: BellRing },
  { id: 'access', label: 'Acessos', icon: Clock },
  { id: 'login', label: 'Histórico de login', icon: LogIn },
];

export function CustomerDetailView({
  customer,
  products,
  notifications,
  renewals,
  logs,
  visits,
  onBack,
  onUpdate,
  onChangeStatus,
  onDelete,
  onNotify,
  onAddNote,
  onDeleteNotification,
}: CustomerDetailViewProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(customer);
  const [showDelete, setShowDelete] = useState(false);
  const [noteText, setNoteText] = useState('');

  const customerProducts = products.filter((p) => p.customerId === customer.id);
  const activatedProducts = customerProducts.filter((p) => p.status === 'Ativado' || p.status === 'Renovado' || p.status === 'Expirando' || p.status === 'Expirado');
  const customerNotifications = notifications.filter((n) => n.customerId === customer.id);
  const customerRenewals = renewals.filter((r) => r.customerId === customer.id);
  // "Histórico completo": todas as ações administrativas relacionadas a este
  // cliente (edição, mudança de status, notificações, renovações de seus
  // produtos...). "Logs administrativos" (aba seguinte) é o subconjunto
  // específico de ações feitas diretamente sobre a ficha do cliente.
  const customerLogs = logs.filter((l) => l.entityId === customer.id || l.details.includes(customer.id));
  const customerAdminLogs = customerLogs.filter((l) => l.entityType === 'Customer');
  const customerVisits = visits
    .filter((v) => v.customerId === customer.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSave = () => {
    onUpdate(customer.id, form);
    setIsEditing(false);
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    onAddNote(customer.id, noteText);
    setNoteText('');
  };

  const statusConfig: Record<CustomerStatus, { label: string; color: string; dot: string }> = {
    Ativo: { label: 'Ativo', color: 'bg-emerald-500/10 text-emerald-400', dot: 'bg-emerald-500' },
    Bloqueado: { label: 'Bloqueado', color: 'bg-red-500/10 text-red-400', dot: 'bg-red-500' },
    Suspenso: { label: 'Suspenso', color: 'bg-yellow-500/10 text-yellow-400', dot: 'bg-yellow-500' },
    Inativo: { label: 'Inativo', color: 'bg-zinc-500/10 text-zinc-400', dot: 'bg-zinc-500' },
  };
  const cfg = statusConfig[customer.status];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={onBack} className="shrink-0 rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-zinc-200">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-800 text-base font-semibold text-zinc-300 sm:h-14 sm:w-14 sm:text-lg">
              {getInitials(customer.name)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-zinc-100 sm:text-xl">{customer.name}</h2>
              <p className="truncate text-sm text-zinc-500">{customer.company || '—'}</p>
            </div>
          </div>
          <Badge variant="dot" colorClass={cfg.color} dotColor={cfg.dot}>{cfg.label}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isEditing ? (
            <button onClick={handleSave} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-2.5 py-2 text-sm font-semibold text-white hover:bg-emerald-600 sm:px-4" title="Salvar">
              <Save className="h-4 w-4" /> <span className="hidden sm:inline">Salvar</span>
            </button>
          ) : (
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 sm:px-4" title="Editar">
              <Edit3 className="h-4 w-4" /> <span className="hidden sm:inline">Editar</span>
            </button>
          )}
          <button onClick={() => onNotify(customer)} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 sm:px-4" title="Notificar">
            <Bell className="h-4 w-4" /> <span className="hidden sm:inline">Notificar</span>
          </button>
          <button onClick={() => window.open(`mailto:${customer.email}`, '_blank')} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 sm:px-4" title="Email">
            <Mail className="h-4 w-4" /> <span className="hidden sm:inline">Email</span>
          </button>
          <button onClick={() => window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}`, '_blank')} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 sm:px-4" title="WhatsApp">
            <MessageCircle className="h-4 w-4" /> <span className="hidden sm:inline">WhatsApp</span>
          </button>
          {customer.status === 'Ativo' ? (
            <button onClick={() => onChangeStatus(customer.id, 'Bloqueado')} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 sm:px-4" title="Bloquear">
              <Lock className="h-4 w-4" /> <span className="hidden sm:inline">Bloquear</span>
            </button>
          ) : (
            <button onClick={() => onChangeStatus(customer.id, 'Ativo')} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 sm:px-4" title="Desbloquear">
              <Unlock className="h-4 w-4" /> <span className="hidden sm:inline">Desbloquear</span>
            </button>
          )}
          {customer.status === 'Suspenso' ? (
            <button onClick={() => onChangeStatus(customer.id, 'Ativo')} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 sm:px-4" title="Reativar">
              <PlayCircle className="h-4 w-4" /> <span className="hidden sm:inline">Reativar</span>
            </button>
          ) : (
            <button onClick={() => onChangeStatus(customer.id, 'Suspenso')} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 sm:px-4" title="Suspender">
              <PauseCircle className="h-4 w-4" /> <span className="hidden sm:inline">Suspender</span>
            </button>
          )}
          <button onClick={() => setShowDelete(true)} className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-2.5 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 sm:px-4" title="Excluir">
            <Trash2 className="h-4 w-4" /> <span className="hidden sm:inline">Excluir</span>
          </button>
        </div>
      </div>

      <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-zinc-800 pb-1 sm:gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              className={`flex shrink-0 items-center gap-2 rounded-t-xl px-3 py-2.5 text-sm font-medium transition-colors sm:px-4 ${
                activeTab === tab.id ? 'border-b-2 border-indigo-500 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <InfoCard label="Plano" value={customer.plan} sub={formatCurrency(customer.planValue) + '/mês'} />
            <InfoCard label="Produtos" value={String(customer.productCount)} sub="ativados" />
            <InfoCard label="Próxima renovação" value={formatDate(customer.nextRenewalDate)} sub={`${customer.daysRemaining} dias restantes`} />
            <InfoCard label="Último acesso" value={formatDate(customer.lastAccessAt)} sub={formatDateTime(customer.lastAccessAt)} />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard title="Dados completos">
              {isEditing ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                  <Field label="Empresa" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
                  <Field label="Telefone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                  <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                  <Field label="Documento" value={form.document} onChange={(v) => setForm({ ...form, document: v })} />
                  <Field label="Plano" value={form.plan} onChange={(v) => setForm({ ...form, plan: v as Customer['plan'] })} />
                  <Field label="Cidade" value={form.address.city} onChange={(v) => setForm({ ...form, address: { ...form.address, city: v } })} />
                  <Field label="Estado" value={form.address.state} onChange={(v) => setForm({ ...form, address: { ...form.address, state: v } })} />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ReadOnly label="Nome" value={customer.name} />
                  <ReadOnly label="Empresa" value={customer.company} />
                  <ReadOnly label="Telefone" value={customer.phone} />
                  <ReadOnly label="Email" value={customer.email} />
                  <ReadOnly label="Documento" value={customer.document} />
                  <ReadOnly label="Plano" value={customer.plan} />
                  <ReadOnly label="Endereço" value={`${customer.address.street}, ${customer.address.city} - ${customer.address.state}`} />
                  <ReadOnly label="CEP" value={customer.address.zipCode} />
                  <ReadOnly label="Data de cadastro" value={formatDate(customer.registeredAt)} />
                  <ReadOnly label="Primeira ativação" value={formatDate(customer.firstActivationAt)} />
                </div>
              )}
            </SectionCard>

            <SectionCard title="Observações internas">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
                <StickyNote className="mb-2 h-4 w-4 text-zinc-500" />
                {customer.internalNotes || 'Nenhuma observação interna registrada.'}
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Adicionar observação..."
                  className="h-10 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700"
                />
                <button onClick={handleAddNote} className="shrink-0 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600">
                  Adicionar
                </button>
              </div>
            </SectionCard>
          </div>
        </>
      )}

      {activeTab === 'products' && (
        <SectionCard title="Produtos ativados">
          {activatedProducts.length === 0 ? (
            <EmptyState title="Nenhum produto ativado" description="Este cliente ainda não ativou produtos." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-3 py-2">Código</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Validade</th>
                    <th className="px-3 py-2">Lote</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {activatedProducts.map((p) => {
                    const v = getValidityStatus(p.daysRemaining);
                    return (
                      <tr key={p.id} className="hover:bg-zinc-800/30">
                        <td className="px-3 py-2 text-zinc-300">{p.internalCode}</td>
                        <td className="px-3 py-2 text-zinc-300">{p.type || '—'}</td>
                        <td className="px-3 py-2"><Badge colorClass={cn(v.bg, v.text)}>{p.status}</Badge></td>
                        <td className="px-3 py-2 text-zinc-400">{p.expiresAt ? formatDate(p.expiresAt) : '—'}</td>
                        <td className="px-3 py-2 text-zinc-400">{p.lotId}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {activeTab === 'history' && (
        <SectionCard title="Histórico completo">
          {customerLogs.length === 0 ? (
            <EmptyState title="Sem histórico" description="Nenhuma ação registrada para este cliente." />
          ) : (
            <div className="relative space-y-6 pl-4 before:absolute before:left-1.5 before:top-2 before:h-full before:w-px before:bg-zinc-800">
              {customerLogs.map((log) => (
                <div key={log.id} className="relative min-w-0">
                  <span className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full border-2 border-zinc-900 bg-indigo-500" />
                  <p className="text-sm font-medium text-zinc-200">{log.action}</p>
                  <p className="break-words text-xs text-zinc-500">{formatDateTime(log.performedAt)} • {log.performedBy}</p>
                  <p className="mt-1 break-words text-sm text-zinc-400">{log.details}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {activeTab === 'logs' && (
        <SectionCard title="Logs administrativos">
          {customerAdminLogs.length === 0 ? (
            <EmptyState title="Sem logs" description="Nenhuma ação administrativa foi registrada diretamente sobre a ficha deste cliente ainda." />
          ) : (
            <div className="space-y-3">
              {customerAdminLogs.map((log) => (
                <div key={log.id} className="min-w-0 rounded-xl border border-zinc-800 p-3 text-sm">
                  <p className="font-medium text-zinc-200">{log.action}</p>
                  <p className="break-words text-xs text-zinc-500">{formatDateTime(log.performedAt)} • {log.performedBy}</p>
                  <p className="mt-1 break-words text-zinc-400">{log.details}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {activeTab === 'activations' && (
        <SectionCard title="Ativações">
          {customerProducts.filter((p) => p.activatedAt).length === 0 ? (
            <EmptyState title="Nenhuma ativação" description="Este cliente ainda não ativou produtos." />
          ) : (
            <div className="space-y-3">
              {customerProducts.filter((p) => p.activatedAt).map((p) => (
                <div key={p.id} className="flex flex-col gap-2 rounded-xl border border-zinc-800 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200">{p.internalCode} {p.type ? `— ${p.type}` : ''}</p>
                    <p className="break-all text-xs text-zinc-500">{p.uuid}</p>
                  </div>
                  <div className="text-sm text-zinc-400 sm:text-right">
                    <p>Ativado em {formatDateTime(p.activatedAt)}</p>
                    <p className="text-xs">Expira em {formatDate(p.expiresAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {activeTab === 'renewals' && (
        <SectionCard title="Renovações">
          {customerRenewals.length === 0 ? (
            <EmptyState title="Nenhuma renovação" />
          ) : (
            <div className="space-y-3">
              {customerRenewals.map((r) => (
                <div key={r.id} className="flex flex-col gap-2 rounded-xl border border-zinc-800 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200">Produto {r.productId.slice(-6)}</p>
                    <p className="text-xs text-zinc-500">{r.periodYears} ano(s) • {formatCurrency(r.amount)}</p>
                  </div>
                  <div className="text-sm text-zinc-400 sm:text-right">
                    <p>{formatDate(r.renewedAt)}</p>
                    <p className="text-xs">Expira em {formatDate(r.newExpiresAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {activeTab === 'notifications' && (
        <SectionCard title="Notificações enviadas">
          {customerNotifications.length === 0 ? (
            <EmptyState title="Nenhuma notificação" />
          ) : (
            <div className="space-y-3">
              {customerNotifications.map((n) => (
                <div key={n.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-200">{n.title}</p>
                    <p className="text-xs text-zinc-500">{n.channel} • {n.status}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <p className="text-xs text-zinc-500">{formatDateTime(n.sentAt)}</p>
                    <button
                      onClick={() => { if (confirm('Excluir esta notificação? O cliente deixará de vê-la.')) onDeleteNotification(n.id); }}
                      className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                      title="Excluir notificação"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {activeTab === 'access' && (
        <SectionCard title="Acessos">
          {customerVisits.length === 0 ? (
            <EmptyState title="Sem registros" description="Nenhum acesso via NFC, QR code ou link registrado para os produtos deste cliente ainda." />
          ) : (
            <div className="space-y-3">
              {customerVisits.map((v) => (
                <div key={v.id} className="flex flex-col gap-2 rounded-xl border border-zinc-800 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium text-zinc-200">{v.action || 'Acesso ao perfil'} {v.type ? `via ${v.type.toUpperCase()}` : ''}</p>
                    <p className="break-words text-xs text-zinc-500">{v.city || 'Localização não identificada'} • {v.device || 'Dispositivo não identificado'}</p>
                  </div>
                  <p className="shrink-0 text-xs text-zinc-500">{formatDateTime(v.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {activeTab === 'login' && (
        <SectionCard title="Histórico de login">
          <EmptyState
            title="Não disponível"
            description="O Supabase Auth não expõe o histórico de logins para o cliente da aplicação — apenas via API administrativa com service_role, que este painel não usa. Para habilitar este histórico, é necessário registrar cada login em uma tabela própria (ex.: login_history) a partir de uma Edge Function."
          />
        </SectionCard>
      )}

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Excluir cliente">
        <p className="text-sm text-zinc-400">Tem certeza que deseja excluir <strong className="text-zinc-200">{customer.name}</strong>?</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setShowDelete(false)} className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800">Cancelar</button>
          <button onClick={() => onDelete(customer.id)} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">Excluir</button>
        </div>
      </Modal>
    </div>
  );
}

function InfoCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-zinc-100">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{sub}</p>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="mb-4 text-sm font-semibold text-zinc-200">{title}</h3>
      {children}
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="break-words text-sm text-zinc-200">{value || '—'}</p>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-zinc-500">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700"
      />
    </div>
  );
}
