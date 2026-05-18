# CLAUDE.md — devquote-frontend

Instruções para o agente. Overview e funcionalidades estão no `README.md`. Regras do monorepo no `../CLAUDE.md`.

## Stack
React 18.2 · TypeScript 5.5 · Vite 5 · React Router 6.30 · Tailwind 3.4 · React Hook Form 7.62 + Yup 1.7 · Axios 1.11 · TipTap 2.10 · dnd-kit · Lucide · react-hot-toast.

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

## Estrutura `src/`

`App.tsx` (rotas), `components/{auth,billing,deliveries,filters,forms,layout,tasks,ui}/`, `hooks/`, `pages/{billing,deliveries,notifications,parameters,profiles,projects,requesters,tasks}/`, `services/` (~24 axios), `types/*.types.ts`, `utils/` (`validationSchemas` com Yup, `constants`, `formatters`, `errorHandler`, `routeConfig`).

Path alias: `@/` → `./src` (configurado em `vite.config.ts` e `tsconfig.json`).

## Convenções (seguir ao adicionar feature)

- **HTTP só via `services/`** (que usa `services/api.ts` axios). Nunca `fetch` direto.
- **Validação com Yup centralizada em `utils/validationSchemas.ts`.** Não definir schema inline no componente.
- **Formulários com React Hook Form + Yup.**
- **Tipos por módulo em `types/<modulo>.types.ts`.** Enums devem espelhar o backend (ver gotcha abaixo).
- **Rotas novas:** declarar em `App.tsx` dentro de `<Layout>` e envolver com `<ProtectedRoute requiredProfile=... requiredProfiles=[...]>`.
- **Componentes UI base já existem** em `components/ui/` (Button, Input, Select, Modal, DataTable, FileUpload, RichTextEditor, etc). Reusar antes de criar.
- **Permissões em camadas:** `ProtectedRoute` (perfil) > `ScreenGuard` (tela) > `ResourceGuard` (operação) > `FieldGuard` (campo).

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
```

Trocou enum no backend? Atualize `types/*.types.ts` antes de qualquer outra coisa.

## Auth (`hooks/useAuth.ts` + `services/api.ts`)

- `localStorage`: `auth.user` (JSON), `auth.token`. `storage` listener sincroniza abas.
- Axios injeta `Authorization: Bearer <token>` automaticamente.
- `401` → limpa storage, redireciona `/login`, toast "Sessão expirada".
- Outros status → mensagens PT-BR pré-traduzidas em `services/api.ts`.
- Erros customizáveis via `useErrorHandler`.

## Gotchas

- **Permissões granulares não são validadas no backend hoje** — só perfil. Tela protegida no front **não impede** chamada direta à API. Se for sensível, garantir o lock também no backend.
- **JWT 24h sem refresh.** Token vence → user volta pro login.
- **`VITE_API_URL` é injetada em build time** (ARG do Dockerfile). Cada tag de imagem é fixa para um endpoint.
- **`TaskList.tsx` e `BillingMonthManagement.tsx` têm 1200+ linhas.** Ao alterar, evitar piorar; refactor em componentes menores é bem-vindo se o escopo do PR permitir.
- **`eslint --max-warnings 0`** — qualquer warning quebra o CI. Rodar `npm run lint` antes do push.

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
