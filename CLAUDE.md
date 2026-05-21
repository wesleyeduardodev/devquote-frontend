# CLAUDE.md — devquote-frontend

Instruções para o agente. Overview e funcionalidades estão no `README.md`. Regras do monorepo no `../CLAUDE.md`.

## Stack
React 18.2 · TypeScript 5.5 · Vite 5 · React Router 6.30 · Tailwind 3.4 · React Hook Form 7.62 + Yup 1.7 · Axios 1.11 · TipTap 2.10 · dnd-kit · Lucide · react-hot-toast.

**Design system (redesign concluído — 2026-05-18):** Radix UI + cmdk + class-variance-authority + tailwind-merge + @tanstack/react-table + recharts + date-fns + react-hotkeys-hook. Tokens semânticos em `src/styles/tokens.css` com tema light/dark (atributo `data-theme`). Componentes base novos em `src/components/ui-v2/` (Button, Input, Badge, Card, Sheet, Dialog, DropdownMenu, Tooltip, Popover, Tabs, Checkbox, Switch, Select, Avatar, Skeleton, StatusDot, EmptyState, PageHeader, FormPage, Separator, DataTable). Utilitário `cn()` em `src/utils/cn.ts` (clsx + tailwind-merge).

**Telas migradas (100% v2):** Login, Dashboard, NotFound, UserSettings, Solicitantes (List/Create/Edit), Projetos (List/Create/Edit), Notificações (List), Parâmetros (List + SecretMask), Tarefas (List/Create/Edit/View), Entregas (List/Create/Edit/View), Faturamento, Perfis & Usuários (2 abas: Usuários + Perfis).

**Padrão de telas:** consolidado em `REDESIGN-PATTERN.md` (raiz do front). Listagens usam DataTable v2 com `COLUMN_DEFS` + ColumnsMenu (visibilidade versionada em `localStorage devquote.{módulo}.columns.v2`), Sheet de filtros, chips de filtros ativos, footer com soma, cards mobile. **Ações inline** (ícones visíveis: Editar/Excluir/PDF/etc.) em vez de menu `⋯` nas telas com poucas colunas.

**Entregas — modelo 1:1:** cada Tarefa tem **uma** Entrega (`@OneToOne` no backend). O conceito antigo de "grupo de entregas" foi **eliminado** (DeliveryGroupEdit removido). Rotas: `/deliveries`, `/deliveries/create`, `/deliveries/:id` (ver), `/deliveries/:id/edit`. A lista usa `GET /deliveries` paginado (não mais `grouped-by-task`).

**Faturamento:** status em **PT-BR** (`PENDENTE/FATURADO/PAGO/ATRASADO/CANCELADO`) com ícone+cor; KPIs somam por status; filtros Fluxo/Ano/Mês/Status; ações inline (Ver/Vincular/Desvincular/E-mail/Editar/Excluir).

**Dashboard:** usa dados **reais** (`/billing-periods`, `/tasks/stats`, `/deliveries/stats`). O `DashboardServiceImpl` antigo (fake, `Math.random()`) foi aposentado — `/dashboard/stats` só serve `recentActivities`.

**Modais existentes integrados sem reescrita:** LinkTasksToBillingModal, UnlinkTasksFromBillingModal, ViewTasksModal, BillingPeriodAttachmentModal, NotificationModal, ParameterModal, ProfileModal, UserAssignmentModal, TaskSelectionModal, ProjectSelectionModal, DeliveryItemForm, DeliveryOperationalItemForm, TaskForm. Têm erros TS pré-existentes mas funcionam — não foram tocados pra evitar regressão.

## Comandos

```powershell
npm install
npm run dev          # http://localhost:3000 (auto-open)
npm run build        # output em dist/
npm run lint         # eslint --max-warnings 0 (qualquer warning quebra)
npm run typecheck    # tsc --noEmit
npm run preview      # serve o build local
```

Antes de PR: rodar `npm run lint` e `npm run typecheck`.

## Atalhos de teclado (M1 do redesign)

| Tecla | Ação |
|---|---|
| `⌘K / Ctrl+K` | Command palette (busca + criar + navegar + tema) |
| `⌘N / Ctrl+N` | Criar contextual (na listagem de Tarefas → nova tarefa, etc.) |
| `G D` | Ir para Dashboard |
| `G T` | Ir para Tarefas |
| `G E` | Ir para Entregas |
| `G F` | Ir para Faturamento |
| `[` | Toggle sidebar colapsada |

Implementação em `src/hooks/useGlobalShortcuts.ts` + `src/components/layout/CommandPalette.tsx`.

## Estrutura `src/`

`App.tsx` (rotas), `components/{auth,billing,deliveries,filters,forms,layout,tasks,ui}/`, `hooks/`, `pages/{billing,deliveries,notifications,parameters,profiles,projects,requesters,tasks}/`, `services/` (~24 axios), `types/*.types.ts`, `utils/` (`validationSchemas` com Yup, `constants`, `formatters`, `errorHandler`, `routeConfig`).

Path alias: `@/` → `./src` (configurado em `vite.config.ts` e `tsconfig.json`).

## Convenções (seguir ao adicionar feature)

- **HTTP só via `services/`** (que usa `services/api.ts` axios). Nunca `fetch` direto.
- **Validação com Yup centralizada em `utils/validationSchemas.ts`.** Não definir schema inline no componente.
- **Formulários com React Hook Form + Yup.**
- **Tipos por módulo em `types/<modulo>.types.ts`.** Enums devem espelhar o backend (ver gotcha abaixo).
- **Rotas novas:** declarar em `App.tsx` dentro de `<Layout>` e envolver com `<ProtectedRoute requiredProfile=... requiredProfiles=[...]>`.
- **Componentes UI base já existem** em `components/ui-v2/` (novo) e `components/ui/` (legado). Reusar antes de criar.
- **Permissões hoje são por perfil** via `useAuth`: `hasProfile('ADMIN')`, `hasAnyProfile([...])`, `isAdmin()`, `isManager()`, `isUser()`. Rotas protegidas por `<ProtectedRoute requiredProfile|requiredProfiles>`. (Os Guards granulares `ScreenGuard/ResourceGuard/FieldGuard` citados em docs antigos não existem mais.)

## ⚠️ Regra crítica: permissões por perfil (escrita vs valores)

Dois gates distintos, **não confundir**:

- **`isAdmin = hasProfile('ADMIN')`** → toda **escrita/gestão**. Criar/editar/excluir tarefa e entrega, e-mails de tarefa, botão Sincronizar, e toda a gestão de Faturamento (vincular/desvincular/e-mail/editar/excluir/anexos/marcar pago/novo período). MANAGER e USER são **read-only** nessas telas.
- **`canViewValues = hasAnyProfile(['ADMIN','MANAGER'])`** (= "não-USER") → **valores monetários** (coluna Valor, somas/footer, KPIs e gráficos do Dashboard, chips de valor nas Views) **e** os elementos de faturamento na lista de Tarefas (chips "Sem entrega/Sem fatura" + coluna Faturamento). USER **nunca** vê valores.

Aplicado em: TaskList, DeliveryList, TaskView, DeliveryView, Dashboard, BillingMonthManagement. **Ao adicionar exibição de valor, gatear por `canViewValues`; ao adicionar ação de escrita, gatear por `isAdmin`.**

O backend reforça os dois: escrita em Task/Delivery/Billing exige `hasRole('ADMIN')` (`@PreAuthorize`); valores usam `SecurityUtils.canViewMonetaryValues()` (= ADMIN ou MANAGER) zerando `amount`/`taskValue`/`total-amount`/relatórios para USER. Por isso o front de **valores** usa ADMIN+MANAGER (alinhado ao backend), e o de **escrita** usa só ADMIN.

| Ação | ADMIN | MANAGER | USER |
|---|---|---|---|
| Tarefas/Entregas — criar/editar/excluir, e-mails, Sincronizar | ✓ | ✗ | ✗ |
| Faturamento — gestão (vincular/.../novo período) | ✓ | ✗ | — |
| Faturamento — Ver tarefas do período | ✓ | ✓ | — |
| Valores monetários (Dashboard/Tarefas/Entregas/Views/Faturamento/relatórios) | ✓ | ✓ | ✗ |

## ⚠️ Regra crítica: Dual Desktop ↔ Mobile (breakpoint `lg` = 1024px)

Páginas de listagem têm **duas implementações na mesma tela**:

```tsx
<div className="hidden lg:block"> <DataTable ... /> </div>   {/* Desktop */}
<div className="lg:hidden"> {items.map(... <Card />)} </div>  {/* Mobile  */}
```

**Mexeu numa, tem que mexer na outra.** Páginas afetadas (confirmadas):
`TaskList`, `TaskCreate`, `TaskEdit`, `DeliveryList`, `DeliveryCreate`, `ProjectList`, `RequesterList`, `ProfileManagement`, `BillingMonthManagement`.

Checklist: coluna adicionada → card mobile reflete; filtro novo → mobile tem versão (geralmente em `<Card>`); ação em lote → mobile habilita; mesma lógica de `canViewValues`/`canViewDeliveryColumns`; mesma validação. Testar 375 / 768 / 1920.

## Enums críticos (alinhar com backend ao mudar)

```ts
FlowType:       'DESENVOLVIMENTO' | 'OPERACIONAL'
TaskType:       'BUG' | 'ENHANCEMENT' | 'NEW_FEATURE' | 'BACKUP' | 'DEPLOY'
                | 'LOGS' | 'NOVO_SERVIDOR' | 'MONITORING' | 'SUPPORT' | 'CODE_REVIEW'
TaskPriority:   'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
DeliveryStatus: 'PENDING' | 'DEVELOPMENT' | 'DELIVERED' | 'HOMOLOGATION'
                | 'APPROVED' | 'REJECTED' | 'PRODUCTION' | 'CANCELLED'
BillingStatus (PT-BR!): 'PENDENTE' | 'FATURADO' | 'PAGO' | 'ATRASADO' | 'CANCELADO'
```

⚠️ **Atenção:** o status de Faturamento (`BillingPeriod.status`) é **string PT-BR** no backend (não enum em inglês). Comparar/filtrar sempre com esses valores.

Trocou enum no backend? Atualize `types/*.types.ts` antes de qualquer outra coisa.

## Auth (`hooks/useAuth.ts` + `services/api.ts`)

- `localStorage`: `auth.user` (JSON), `auth.token`. `storage` listener sincroniza abas.
- Axios injeta `Authorization: Bearer <token>` automaticamente.
- `401` → limpa storage, redireciona `/login`, toast "Sessão expirada".
- Outros status → mensagens PT-BR pré-traduzidas em `services/api.ts`.
- Erros customizáveis via `useErrorHandler`.

## Gotchas

- **Acesso de tela é só por perfil (`ProtectedRoute`)** — telas granulares por operação não são validadas no backend. Para dados **monetários** há reforço no backend (ver regra de valores acima). Para outros dados sensíveis, garantir o lock também no backend.
- **JWT 24h sem refresh.** Token vence → user volta pro login.
- **`VITE_API_URL` é injetada em build time** (ARG do Dockerfile). Cada tag de imagem é fixa para um endpoint.
- **`TaskList.tsx` é grande (~1300 linhas)** — contém ColumnsMenu/StatChip/FilterSection inline. Ao alterar, evitar piorar; refactor é bem-vindo se o escopo do PR permitir. (`BillingMonthManagement.tsx` foi reescrito e hoje tem ~600 linhas.)
- **Editor (TipTap) com autolink desligado** (`Link.configure({ autolink:false, linkOnPaste:false })` em `RichTextEditor`) — colar SQL/código não vira link.
- **`eslint --max-warnings 0`** — qualquer warning quebra o CI. (No ambiente local pode faltar `@typescript-eslint` em `node_modules`; o CI tem.) Há ~66 erros TS pré-existentes em arquivos legados; `vite build` passa mesmo assim.

## `.env` (local)

```
VITE_API_URL=http://localhost:8080/api
VITE_APP_NAME=DevQuote
VITE_APP_ENV=development
```

Em prod a SPA é servida pelo mesmo host do backend; `VITE_API_URL` aponta para `/api`.

## Deploy

`git push` master → GitHub Actions builda + lint + push `wesleyeduardodev/devquote-frontend:sha-<short>` no Docker Hub → workflow commita tag em `devquote-infra/tenants/{wesley,joao}/frontend/deployment.yaml` → Argo CD aplica (~3min).

## Antes de mexer

| Vou… | Olhar primeiro |
|---|---|
| Adicionar página | `pages/` + rota em `App.tsx` (com `ProtectedRoute`) + service em `services/` |
| Adicionar form | `components/forms/` + schema Yup em `utils/validationSchemas.ts` |
| Mexer em listagem | versão desktop **E** versão mobile da mesma página (regra acima) |
| Novo campo na entidade | `types/<modulo>.types.ts` → service → form/page → coluna DataTable → bloco do card mobile |
| Tratar erro de API | já tem interceptor; personalizar via `useErrorHandler` |
| Subir modal | `components/ui/Modal` |
| Mudar paleta/breakpoint | `tailwind.config.ts` + audit visual |
