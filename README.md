# DevQuote Frontend

## 🎯 Propósito
Aplicação web React/TypeScript para gestão completa de tarefas, entregas e faturamento de projetos de desenvolvimento. Interface moderna e responsiva com sistema avançado de permissões granulares.

## 🛠️ Stack Tecnológica
- **React 18.2.0** + **TypeScript 5.5.4**
- **Vite 5.0** (build tool rápida)
- **TailwindCSS 3.4.17** (design system utility-first)
- **React Router 6.30.1** (SPA routing)
- **React Hook Form 7.62** + **Yup 1.7** (formulários e validação)
- **Axios 1.11** (cliente HTTP com interceptors)
- **Lucide React 0.294** (ícones modernos)
- **React Hot Toast 2.5** (notificações)

## 📁 Estrutura do Projeto
```
src/
├── components/          # Componentes reutilizáveis
│   ├── auth/            # Guards: ScreenGuard, ResourceGuard, FieldGuard
│   ├── billing/         # Modais e componentes de faturamento
│   ├── deliveries/      # Componentes de entregas (create, modals, forms)
│   ├── forms/           # Formulários: Task, Project, Requester, Delivery, etc
│   ├── layout/          # Layout, Header, Sidebar, Footer
│   ├── tasks/           # TaskDetailModal
│   ├── ui/              # Componentes base: Button, Input, Modal, DataTable, etc
│   └── ProtectedRoute.tsx
├── hooks/               # Custom hooks (useAuth, useApi, useTasks, etc)
├── pages/               # 25 páginas organizadas por módulo
│   ├── billing/         # BillingPeriodManagement, BillingMonthManagement
│   ├── deliveries/      # DeliveryList, DeliveryCreate, DeliveryEdit, etc
│   ├── projects/        # ProjectList, Create, Edit
│   ├── requesters/      # RequesterList, Create, Edit
│   ├── tasks/           # TaskList, Create, Edit
│   ├── profiles/        # ProfileManagement, modals de permissões
│   ├── notifications/   # NotificationList, NotificationModal
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   └── UserSettings.tsx
├── services/            # API services (20 services para cada endpoint)
├── types/               # Tipos TypeScript (auth, task, delivery, billing, etc)
├── utils/               # constants, errorHandler, validationSchemas, routeConfig
└── App.tsx + main.tsx
```

## 🔑 Funcionalidades Principais

### Sistema de Autenticação Multi-Camadas
- **Login JWT** com auto-refresh e controle de expiração
- **4 níveis de permissão**:
  1. **Profile** (ADMIN > MANAGER > USER)
  2. **Screen** (acesso a páginas)
  3. **Resource** (operações: CREATE, READ, UPDATE, DELETE, BULK)
  4. **Field** (controle granular: READ, EDIT, HIDDEN)
- **Guards customizados**:
  - `ProtectedRoute` - proteção de rotas
  - `ScreenGuard` - proteção de telas
  - `ResourceGuard` - proteção de operações
  - `FieldGuard` - proteção de campos em formulários

### Dashboard
- Estatísticas em tempo real (tarefas, entregas, faturamento)
- Cards de resumo com métricas
- Exportação de relatórios (Excel) para todos os módulos
- Acesso rápido às funcionalidades

### Gestão de Tarefas
- CRUD completo com validação Yup
- **SubTasks** dinâmicas com valores individuais
- Fluxos: **DESENVOLVIMENTO** e **OPERACIONAL**
- Tipos: BUG, ENHANCEMENT, NEW_FEATURE, BACKUP, DEPLOY, etc
- Prioridades: LOW, MEDIUM, HIGH, URGENT
- Anexos de arquivos (upload/download via S3)
- Filtros avançados (flowType, status, prioridade, solicitante)
- Paginação dinâmica
- Exportação Excel
- Indicadores: hasDelivery, hasQuoteInBilling, emailsSent

### Sistema de Entregas
- **Arquitetura nova**: Delivery → DeliveryItem[] + DeliveryOperationalItem[]
- Status calculado automaticamente baseado nos itens
- **Itens de Desenvolvimento**:
  - Associação Tarefa → Projeto
  - Branch (develop, feature, hotfix), sourceBranch, PR
  - Status individual, datas, anexos
- **Itens Operacionais**: fluxo simplificado para tarefas não-técnicas
- Status: PENDING → DEVELOPMENT → DELIVERED → HOMOLOGATION → APPROVED/REJECTED → PRODUCTION
- Upload de anexos locais e remotos
- Mudança de status em lote
- Modal de seleção de projetos
- Exportação Excel (separado por flowType)

### Gestão de Faturamento
- **BillingMonth**: mês/ano, data pagamento, status, totalizadores
- **BillingPeriod**: vinculação/desvinculação de tarefas em lote
- Cálculo automático de valores totais
- Filtros: ano, mês, status, flowType
- Modal de visualização de tarefas vinculadas
- Anexos de período (notas fiscais, comprovantes)
- Exportação Excel
- Status: PENDING, SENT, PAID, CANCELLED

### CRUD Básicos
- **Solicitantes** (ADMIN): nome, email, telefone, status
- **Projetos** (ADMIN): nome, repositório, status
- **Perfis** (ADMIN): configuração de permissões multi-nível
- **Notificações** (ADMIN): templates e configurações de envio

### Configurações de Usuário
- Atualização de perfil pessoal
- Troca de senha
- Preferências

## 🎨 UI/UX

### Design System Customizado (TailwindCSS)
- **Paleta extendida**: primary (blue 50-950), gray, success, warning, error
- **Animações**: fade-in, slide-up/down, pulse-slow
- **Fontes**: Inter (sans), Fira Code (mono)
- **Breakpoints**: xs, sm, md, lg, xl, 2xl

### Componentes Base
- Button (primary, secondary, danger, ghost)
- Input, Select, TextArea
- Card, Modal, LoadingSpinner
- **DataTable**: ordenação, paginação, seleção múltipla, ações em lote, filtros
- **FileUpload**: drag&drop, preview, validação tipo/tamanho, progress
- **AttachmentList**: preview, download, delete
- StatusChangeModal, DeleteConfirmationModal, BulkDeleteModal

### Experiência do Usuário
- **Toast notifications** com feedback visual (sucesso, erro, info)
- **Loading states** em todas as ações
- **Validação em tempo real** com mensagens inline
- **Menu responsivo** (desktop horizontal, mobile sidebar)
- **Debounce** em buscas
- **Paginação incremental**
- **Acessibilidade**: labels, ARIA, keyboard navigation, contraste

## 🔒 Segurança
- **Token JWT** injetado automaticamente nos headers
- **Auto-logout** em 401 (token expirado)
- **Proteção de rotas** por perfil e tela
- **Guards em componentes** (operações e campos)
- **Nginx headers** de segurança: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection

## ⚙️ Configuração
Variáveis de ambiente (`.env.example`):
```bash
VITE_API_URL=http://localhost:8080/api
VITE_APP_NAME=DevQuote
VITE_APP_ENV=development
```

Vite config:
- Port: 3000
- Path alias: `@/` → `./src`
- Auto-open browser
- Sourcemap habilitado

## 🚀 Build e Deploy

### Scripts NPM
```bash
npm run dev        # Servidor desenvolvimento (porta 3000)
npm run build      # Build produção (output: dist/)
npm run preview    # Preview do build
npm run lint       # ESLint
npm run typecheck  # TypeScript validation
```

### Docker Multi-Stage
**Stage 1 (Build)**: Node 18 Alpine → `npm ci` → `npm run build`
**Stage 2 (Serve)**: Nginx Alpine → copia dist/ → gzip compression → cache strategy

### CI/CD (GitHub Actions)
- **Trigger**: push main/master, PRs, workflow manual
- **Pipeline**: checkout → install → lint → build → docker build & push
- **Registry**: Docker Hub (`wesleyeduardodev/devquote-frontend`)
- **Tags**: latest, {version}, sha-{commit}

### Nginx
- SPA routing com `try_files`
- Gzip compression ativado
- Cache: assets 1 ano, index.html no-cache
- Health check

## 📊 Status Atual

### ✅ Completo e Funcional (95%)
- Autenticação e sistema de permissões multi-camadas (100%)
- CRUD de Solicitantes, Projetos, Tarefas, Entregas, Faturamento (100%)
- Dashboard com estatísticas e exportações (100%)
- Gestão de perfis e usuários (95%)
- UI/UX profissional e responsivo (100%)
- Sistema de entregas com nova arquitetura (100%)
- Formulários complexos com validação (100%)
- Upload/download de anexos (100%)
- CI/CD automatizado (100%)

### ⚠️ TODOs Pendentes (Baixa Prioridade)
1. **useUserManagement.ts**: implementar assignRoleToUser, removeRoleFromUser, updateUserProfile
2. **DeliveryCreateNew.tsx**: arquivo duplicado (possível teste), avaliar remoção
3. Melhorias opcionais:
   - Dark mode
   - Internacionalização (i18n)
   - Testes unitários/E2E
   - Storybook para componentes

## 💡 Contexto de Uso
Interface web que consome a API REST do devquote-backend. Permite gerenciar todo o ciclo de vida de demandas: criação de tarefas → vinculação a entregas → acompanhamento de status → fechamento mensal para faturamento. Sistema multi-tenant com controle granular de acessos por perfil.

## 🔗 Integração com Backend
- Base URL configurável via `VITE_API_URL`
- Interceptors Axios para auth e error handling
- Formato padronizado de erros do backend
- Paginação padrão: `?page=0&size=10&sort=id,desc`
- Filtros query params: `?status=ACTIVE&flowType=DESENVOLVIMENTO`

## 📦 Deploy
```bash
docker build -t devquote-frontend .
docker run -p 80:80 devquote-frontend
```
Ou usar imagem do Docker Hub: `wesleyeduardodev/devquote-frontend:latest`
