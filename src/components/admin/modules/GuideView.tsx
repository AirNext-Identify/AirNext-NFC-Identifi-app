import { useState } from 'react';
import {
  BookOpen,
  Boxes,
  Cpu,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  Radio,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/adminUtils';
import type { AdminModule } from '@/types/admin';

interface GuideViewProps {
  onNavigate: (module: AdminModule) => void;
}

const steps = [
  {
    id: 'overview',
    title: '1. Arquitetura & Fluxo AirNext',
    subtitle: 'Como o ERP Interno se conecta à ativação do cliente',
    icon: Layers,
  },
  {
    id: 'lots',
    title: '2. Criação de Lotes Únicos',
    subtitle: 'Geração de centenas de produtos sem colisões',
    icon: Boxes,
  },
  {
    id: 'nfc',
    title: '3. Programador NFC (Smartphone)',
    subtitle: 'Gravação física dos chips NTAG213/215 via Web NFC',
    icon: Cpu,
  },
  {
    id: 'customers',
    title: '4. Ativação & Associação',
    subtitle: 'Como os chips ganham vida na mão do cliente final',
    icon: ShieldCheck,
  },
  {
    id: 'troubleshooting',
    title: '5. Diagnóstico & Solução de Problemas',
    subtitle: 'Dicas de hardware e resolução rápida de erros',
    icon: AlertTriangle,
  },
];

export function GuideView({ onNavigate }: GuideViewProps) {
  const [activeStep, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Banner de Boas-vindas ao Guia */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/60 via-zinc-900 to-zinc-950 p-6 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
              <BookOpen className="h-3.5 w-3.5" /> Manual & Guia Operacional Inteligente
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Como dominar o ecossistema de gestão e gravação NFC AirNext
            </h2>
            <p className="text-sm text-zinc-300/80 leading-relaxed">
              Esta central ensina passo a passo desde a criação de lotes criptograficamente únicos até a gravação
              física dos chips em um smartphone Android, garantindo que sua equipe opere em máxima velocidade e segurança.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              onClick={() => onNavigate('lots')}
              className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-600"
            >
              <Boxes className="h-4 w-4" /> Ir para Lotes
            </button>
            <button
              onClick={() => onNavigate('nfc')}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-all hover:bg-zinc-800 hover:text-white"
            >
              <Cpu className="h-4 w-4" /> Programador NFC
            </button>
          </div>
        </div>
      </div>

      {/* Grid com Abas de Navegação e Conteúdo */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Menu Lateral das Abas */}
        <div className="space-y-2 lg:col-span-1">
          {steps.map((s) => {
            const Icon = s.icon;
            const isSelected = activeStep === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveTab(s.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all',
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-md'
                    : 'border-zinc-800/80 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-200'
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    isSelected ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-400'
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm">{s.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs opacity-75">{s.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Painel de Conteúdo Detalhado */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 lg:col-span-3">
          {activeStep === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-zinc-100 sm:text-xl">1. Arquitetura & Fluxo AirNext</h3>
                <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
                  O painel AirNext é focado em <strong>gestão operacional e suprimentos</strong>. Para evitar erros na
                  produção em massa, adotamos o conceito de <em>Late Binding</em> (Associação Posterior): quando você produz um lote,
                  o sistema não precisa saber previamente se a tag se tornará um cartão de visita, uma pulseira ou um stand.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-sm">
                    A
                  </div>
                  <h4 className="font-semibold text-zinc-200 text-sm">Criação do Lote</h4>
                  <p className="mt-1 text-xs text-zinc-400">
                    O administrador gera ex: 500 produtos em um lote. O sistema cria automaticamente 500 UUIDs (v4 seguros)
                    e 500 códigos de ativação de alta entropia.
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-sm">
                    B
                  </div>
                  <h4 className="font-semibold text-zinc-200 text-sm">Gravação NFC (Fábrica)</h4>
                  <p className="mt-1 text-xs text-zinc-400">
                    O operador abre o Programador NFC no celular e grava cada chip. A URL gravada é sempre <code className="text-indigo-300">{window.location.origin.includes('localhost') ? 'https://SEU-DOMINIO' : window.location.origin}/n/&#123;uuid&#125;</code> (definida em VITE_PUBLIC_APP_URL).
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-sm">
                    C
                  </div>
                  <h4 className="font-semibold text-zinc-200 text-sm">Ativação pelo Cliente</h4>
                  <p className="mt-1 text-xs text-zinc-400">
                    O cliente adquire o produto e acessa a URL ou digita o código de ativação em seu SaaS. Nesse momento,
                    o produto muda para <strong>Ativado</strong> com validade exata de 24 meses.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <div className="text-xs text-emerald-200 space-y-1">
                    <p className="font-semibold text-sm text-emerald-300">Por que essa arquitetura é superior?</p>
                    <p>
                      Ela permite que a fábrica grave 10.000 chips NTAG prontos para envio imediato para qualquer cliente ou revendedor,
                      sem engessar o estoque com configurações ou personalizações prematuras.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 'lots' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-zinc-100 sm:text-xl">2. Criação de Lotes & Segurança de Identificadores</h3>
                <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
                  Ao clicar em <strong>Novo Lote</strong> no módulo Lotes ou Produtos, nosso motor criptográfico entra em ação
                  para garantir que 100% das peças geradas sejam rigorosamente únicas e invioláveis.
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <h4 className="font-semibold text-zinc-200 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> UUID v4 Criptográfico (128 bits)
                  </h4>
                  <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                    Diferente de sistemas legados que usam IDs numéricos previsíveis (como <code>1, 2, 3...</code>), cada chip AirNext ganha um
                    identificador único universal como <code>e3b0c442-98fc-1c14-9pcb-0c2ef3d4...</code>. É matematicamente impossível
                    adivinhar a URL de outro cliente.
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <h4 className="font-semibold text-zinc-200 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Código de Ativação com Alta Entropia & Dígito Verificador
                  </h4>
                  <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                    O código de 20 caracteres gerado (ex: <code>K8XN-M4W2-P9VQ-L7ZT-R2C5</code>) utiliza um alfabeto limpo de 32 caracteres
                    (sem letras ambíguas como <code>0/O</code> ou <code>1/I/L</code>) e inclui verificação algorítmica para rejeitar na hora
                    qualquer erro de digitação cometido pelo cliente ou revendedor.
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <h4 className="font-semibold text-zinc-200 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Prevenção de Conflitos em Tempo Real
                  </h4>
                  <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                    O sistema mantém um registro de auditoria na memória e no Supabase. Se você tentar criar um lote com o código exato
                    de um lote já existente (ex: <code>TAG-2026-001</code>), o sistema anexa automaticamente um sufixo ou avisa na tela para que
                    nenhum histórico seja sobrescrito.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => onNavigate('lots')}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-600"
                >
                  Criar o primeiro lote agora <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {activeStep === 'nfc' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-zinc-100 sm:text-xl">3. Programador NFC — Como gravar no Smartphone</h3>
                <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
                  Nossa ferramenta de gravação foi construída diretamente sobre a <strong>Web NFC API</strong>, dispensando a necessidade de
                  aplicativos nativos pesados, cabos ou leitoras USB externas na linha de montagem.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                    <Smartphone className="h-4 w-4" /> Requisitos do Dispositivo
                  </div>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      Smartphone Android compatível com NFC (série Galaxy, Motorola, Xiaomi, Pixel).
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      Navegador <strong>Google Chrome para Android</strong> (versão 89 ou superior).
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      Acesso servido via protocolo seguro <strong>HTTPS</strong> ou localhost.
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                    <Radio className="h-4 w-4" /> Chips Recomendados
                  </div>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      <strong>NTAG213</strong> (144 bytes): Ideal para cartões, tags adesivas e pulseiras curtas.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      <strong>NTAG215</strong> (504 bytes): Ótimo para stands com dados extras ou múltiplos NDEF.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      Todos os chips devem estar desbloqueados ou com a senha de fábrica padrão.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
                <h4 className="font-semibold text-zinc-200 text-sm">Diferença entre Modo Único e Modo Contínuo</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs text-zinc-400">
                  <div>
                    <p className="font-bold text-zinc-300 mb-1">Modo Programação Única</p>
                    <p>
                      Recomendado para repetições pontuais ou substituição de chip danificado. Você escolhe o produto exato
                      pelo código interno ou UUID, clica no botão "Ler e Gravar NFC" e aproxima a tag.
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-emerald-400 mb-1">Modo Contínuo (Produção Rápida)</p>
                    <p>
                      Projetado para programar lotes inteiros de 500+ chips em poucos minutos. Você escolhe o lote e clica em Iniciar:
                      basta ir aproximando os chips em sequência no verso do celular. O sistema grava, emite feedback sonoro/visual,
                      valida por releitura e passa automaticamente para o próximo!
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => onNavigate('nfc')}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-600"
                >
                  Testar Programador NFC no Smartphone <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {activeStep === 'customers' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-zinc-100 sm:text-xl">4. Ativação, Associação e Controle de Validade</h3>
                <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
                  Quando o produto é entregue ao cliente, a equipe ou o próprio cliente executa a associação pela plataforma SaaS.
                </p>
              </div>

              <div className="space-y-4 text-sm">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <h4 className="font-semibold text-zinc-200 text-sm mb-1">Regra dos 24 Meses de Validade (Exatos)</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Nosso motor nunca usa um número de dias fixo ou genérico (que causaria erros em anos bissextos). A validade é
                    calculada com base no carimbo exato de ativação mais 2 anos completos (<code>addYears(activatedAt, 2)</code>).
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <h4 className="font-semibold text-zinc-200 text-sm mb-1">Ações Rápidas na Ficha do Cliente</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Dentro da ficha do cliente em <strong>Clientes → Ver Detalhes</strong>, sua equipe tem botões instantâneos
                    para: <em>Bloquear acesso em caso de inadimplência, Enviar notificação direta no painel do usuário,
                    Renovar validade por +1, 2 ou 3 anos com um clique, e abrir conversa direto no WhatsApp</em> via link seguro.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeStep === 'troubleshooting' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-zinc-100 sm:text-xl">5. Diagnóstico & Solução Rápida de Problemas</h3>
                <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
                  Problemas ao aproximar a tag no smartphone? Confira nossa verificação em 4 pontos:
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="font-semibold text-zinc-200 text-sm mb-1">🔴 "Leitura/gravação NFC real indisponível neste dispositivo"</p>
                  <p className="text-xs text-zinc-400">
                    Isso significa que você está acessando por um desktop (PC/Mac) ou iPhone/Safari. O iOS no momento limita a Web NFC API.
                    Para gravar de verdade, abra o link por um smartphone <strong>Android no Google Chrome</strong>.
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="font-semibold text-zinc-200 text-sm mb-1">🟡 "Permissão de NFC negada pelo navegador"</p>
                  <p className="text-xs text-zinc-400">
                    No Chrome Android, clique no ícone de cadeado na barra de endereços (URL), vá em <strong>Configurações da Página → Permissões</strong> e ative a chave <strong>NFC</strong>.
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="font-semibold text-zinc-200 text-sm mb-1">🟠 "Chip gravado, mas a confirmação de leitura falhou"</p>
                  <p className="text-xs text-zinc-400">
                    O operador afastou o chip muito rápido do verso do celular. A antena NFC dos celulares geralmente fica próxima à câmera traseira
                    ou no centro da tampa traseira. Mantenha o chip imóvel por 1 segundo até ouvir o beep de confirmação.
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="font-semibold text-zinc-200 text-sm mb-1">🟢 O chip pode ser lido mas não aceita nova gravação</p>
                  <p className="text-xs text-zinc-400">
                    Verifique se a tag NFC não foi trancada fisicamente com trava de gravação permanente (NDEF Read-Only Lock). Tags bloqueadas em modo read-only por outros fabricantes não podem ser reprogramadas.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
