# 📡 AirNect

**Conecte-se ao mundo digital com NFC**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/airnect/airnect-app)

[![CI/CD](https://github.com/airnect/airnect-app/actions/workflows/deploy.yml/badge.svg)](https://github.com/airnect/airnect-app/actions/workflows/deploy.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📋 Sobre o Projeto

AirNect é uma plataforma SaaS completa para gerenciar produtos NFC, permitindo que usuários compartilhem informações, contatos e muito mais através de um simples toque ou escaneamento de QR Code.

## 🚀 Funcionalidades

### Fase 1 - Fundação ✅
- ✅ Arquitetura oficial do projeto
- ✅ Configuração GitHub
- ✅ Deploy automático na Vercel
- ✅ Estrutura de pastas otimizada

### Fase 2 - Banco de Dados (Planejado)
- Schema Prisma
- Modelagem de dados
- Migrations

### Fase 3 - Autenticação (Planejado)
- Login / Cadastro
- Sistema de permissões
- Recuperação de senha

### Fase 4 - Produtos NFC (Planejado)
- Gestão de produtos
- Serial e UID
- Ativação por código

### Fase 5 - Ativação (Planejado)
- Validação de licenças
- Vinculação a perfil
- Histórico

### Fase 6 - Perfis (Planejado)
- Comum
- Profissional
- Business
- Pet
- Kids
- Senior

### Fase 7 - Página Pública (Planejado)
- QR Code dinâmico
- Compartilhamento
- vCard

### Fase 8 - Dashboard Cliente (Planejado)
- Gestão de perfil
- Produtos vinculados
- Estatísticas

### Fase 9 - Painel Admin (Planejado)
- Gestão de clientes
- Licenças
- Analytics

### Fase 10 - Recursos Avançados (Planejado)
- Modo SOS
- Modo Desaparecido
- Marketplace

---

## 🏗️ Arquitetura

```
airnect/
├── .github/                 # GitHub Actions & Configs
│   └── workflows/
│       └── deploy.yml       # CI/CD Pipeline
├── public/                  # Assets públicos
├── src/
│   ├── components/          # Componentes React
│   │   ├── ui/              # Componentes base (Button, Input, Card...)
│   │   ├── layout/          # Layouts (Header, Footer, Sidebar)
│   │   ├── auth/            # Componentes de autenticação
│   │   ├── dashboard/       # Componentes do dashboard
│   │   ├── admin/           # Componentes do admin
│   │   └── shared/          # Componentes compartilhados
│   ├── contexts/            # React Context (Auth, Theme...)
│   ├── hooks/               # Custom Hooks
│   ├── lib/                 # Utilitários e configurações
│   │   ├── constants.ts     # Constantes da aplicação
│   │   └── utils.ts         # Funções utilitárias
│   ├── pages/               # Páginas/Rotas
│   │   ├── dashboard/       # Páginas do cliente
│   │   └── admin/           # Páginas do admin
│   ├── services/            # Serviços API
│   ├── styles/              # Estilos globais
│   ├── types/               # Tipos TypeScript
│   ├── utils/               # Utilitários gerais
│   ├── App.tsx              # Componente raiz
│   ├── main.tsx             # Entry point
│   └── index.css            # Estilos base
├── .env.example             # Variáveis de ambiente
├── .eslintrc.json           # Config ESLint
├── .gitignore               # Git ignore
├── index.html               # HTML entry
├── package.json             # Dependências
├── postcss.config.js        # PostCSS
├── README.md                # Documentação
├── tailwind.config.js       # Tailwind CSS
├── tsconfig.json            # TypeScript
├── vercel.json              # Config Vercel
└── vite.config.ts           # Vite Config
```

---

## 🛠️ Tecnologias

- **Frontend:** React 19, TypeScript, Tailwind CSS
- **Build Tool:** Vite
- **Deploy:** Vercel
- **CI/CD:** GitHub Actions
- **Charts:** Recharts
- **Icons:** Lucide React
- **QR Code:** qrcode.react

---

## 🏃‍♂️ Como Começar

### Pré-requisitos

- Node.js 20+
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone https://github.com/airnect/airnect-app.git

# Entre na pasta
cd airnect-app

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse http://localhost:5173

---

## 📦 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm run lint         # Verificação de código
```

---

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env.local`:

```env
VITE_API_URL=https://api.airnect.com
VITE_APP_URL=https://airnect.com
VITE_GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX
```

---

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push no `main`

### Outros

```bash
npm run build
# O build estará em dist/
```

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.

---

## 👥 Equipe

- **AirNect Team** - Desenvolvimento

---

## 📧 Contato

- **Suporte:** suporte@airnect.com
- **Website:** [airnect.com](https://airnect.com)

---

Feito com ❤️ pela AirNect
