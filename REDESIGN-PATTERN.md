# DevQuote — Padrão de telas do redesign

Este documento descreve o padrão visual, arquitetural e de comportamento aplicado à tela de **Tarefas** (lista, criar, editar, visualizar). Todas as telas seguintes (Entregas, Faturamento, Dashboard, etc.) devem seguir o mesmo padrão, ajustando ao contexto específico de cada uma.

> Fonte de verdade. Quando algo não estiver aqui, copie de `pages/tasks/`. Quando algo aqui contradiz o código real, o código vence — atualize este documento.

---

## 1. Filosofia

| Princípio | Como aplicar |
|---|---|
| **Hierarquia clara antes de decoração** | Sem ícones decorativos grandes em headers. Title 20px > subtitle 14px > label 11px uppercase. |
| **Densidade alta, mas respirável** | Tabelas compactas (`h-10`), formulários `space-y-4` por campo. Padding 24px em cards. |
| **Vocabulário visual único** | Mesmo ícone + cor pra cada conceito (Fluxo, Tipo, Ambiente, Prioridade) entre lista, filtro inline, Sheet e formulário. |
| **Sem emojis em controles** | Use ícones Lucide com cor por classe (`text-[var(--info-strong)]`, etc.). Emoji só em conteúdo do usuário. |
| **Loading sem flash** | Mantenha dados antigos visíveis (opacity-70) + barra fina no topo. Skeleton só no first-load. |
| **Erro inline + toast complementar** | Aponta no campo + toast curto no topo direito. Nunca resetar dados do usuário num erro. |
| **Filtros sempre afetam todas as páginas** | Todo filtro vai pro backend (`setFilter()` no hook). Nenhum filtro client-side. |

---

## 2. Estrutura de arquivos

```
src/
├── components/
│   ├── layout/
│   │   ├── Layout.tsx                # Sidebar + main, sem topbar
│   │   ├── Sidebar.tsx               # Tokens sidebar-* (dark navy no light)
│   │   ├── GlobalTools.tsx           # ⌘K · Sino · Avatar (vai dentro do PageHeader)
│   │   └── CommandPalette.tsx        # cmdk
│   ├── ui-v2/
│   │   ├── PageHeader.tsx            # Linha 1: title + GlobalTools · Linha 2: filters + actions
│   │   ├── DataTable/
│   │   │   ├── DataTable.tsx         # table-fixed + columnFilters prop + footer + loading bar
│   │   │   ├── ColumnFilterInput.tsx # Input com spinner durante loading
│   │   │   ├── DataTableBulkBar.tsx
│   │   │   └── FilterChipsRow.tsx    # Chips de filtros ativos abaixo do header
│   │   ├── Select.tsx                # Radix (com suporte a icon dentro de SelectItem)
│   │   ├── Sheet.tsx                 # Filtros completos
│   │   └── icons/
│   │       └── PdfIcon.tsx           # SVG custom (PDF dentro do doc shape)
│   └── tasks/
│       ├── FlowChip.tsx              # + FLOW_LABEL
│       ├── TaskTypeLabel.tsx         # + TASK_TYPE_META, TypeMeta
│       └── EnvLabel.tsx              # + ENV_META, EnvMeta
├── styles/
│   └── tokens.css                    # Light/Dark/Dim + tokens semânticos + sidebar tokens
└── pages/tasks/
    ├── TaskList.tsx                  # Lista (referência principal)
    ├── TaskCreate.tsx
    ├── TaskEdit.tsx
    └── TaskView.tsx
```

---

## 3. Design tokens (`src/styles/tokens.css`)

### 3.1 Surfaces

| Token | Light | Dark | Dim |
|---|---|---|---|
| `--surface-app` | `#F8F9FB` | `#0E1014` | `#1A1D24` |
| `--surface-1` | `#FFFFFF` | `#161922` | `#21252E` |
| `--surface-2` | `#F1F3F5` | `#1C2029` | `#282D38` |
| `--zebra-row` | `#EEF1F5` | `#1A1E27` | `#262B36` |

### 3.2 Sidebar (sempre escura no light, distinta no dark)

| Token | Light | Dark | Dim |
|---|---|---|---|
| `--sidebar-bg` | `#14192A` (navy) | `#0A0C12` (mais escuro que conteúdo) | `#14171F` |
| `--sidebar-text` | `#E5E7F0` | `#DEE1E8` | `#E2E5EB` |
| `--sidebar-active-bg` | `rgba(107,125,255,.18)` | idem | idem |
| `--sidebar-active-bar` | `var(--brand-400)` | idem | idem |

### 3.3 Status

`--success-soft / --success-strong / --success-border` (verde) · `--warning-*` (amarelo) · `--danger-*` (vermelho) · `--info-*` (azul) · `--accent / --accent-soft` (brand).

### 3.4 Tema

3 temas suportados: `light` (default), `dim` (escuro suave), `dark` (escuro forte). Atributo `data-theme="..."` no `<html>`. Trocado via `useTheme` (com persistência em `devquote.theme`). Default: `light`.

---

## 4. Layout (`components/layout/Layout.tsx`)

```
┌──────────┬──────────────────────────────────────┐
│ Sidebar  │ <main className="overflow-auto">     │
│ (dark)   │   <div className="px-3 sm:px-4       │
│          │     lg:px-4 py-4">                   │
│          │     {children}                       │
│          │   </div>                             │
│          │ </main>                              │
└──────────┴──────────────────────────────────────┘
```

- **Sem topbar separado.** Removido em favor do `GlobalTools` dentro do `PageHeader`.
- **Mobile menu**: botão hambúrguer `fixed top-3 left-3` (visível `<lg`).
- **Padding lateral mínimo no desktop** (`lg:px-4` = 16px), zero não fica bom porque os elementos finais coleriam na sidebar.

---

## 5. PageHeader (`components/ui-v2/PageHeader.tsx`)

**Estrutura em 2 linhas:**

```
┌─────────────────────────────────────────────────────────┐
│ Tarefas · 384 tarefas         [⌘K] [🔔] [Avatar Wesley] │  ← Row 1
├─────────────────────────────────────────────────────────┤
│ [Filtros] [Sem entrega 0]    [⚙ Colunas 12/19]         │  ← Row 2
│ [Sem fatura 3]                [↓ Exportar] [+ Nova]    │
└─────────────────────────────────────────────────────────┘
```

### Props

```ts
interface PageHeaderProps {
  title: ReactNode               // pode incluir badge inline
  subtitle?: ReactNode           // mostra inline com separador "·"
  filters?: ReactNode            // slot esquerda da Row 2
  actions?: ReactNode            // slot direita da Row 2 (ml-auto)
  hideGlobalTools?: boolean
}
```

### Regras

1. **Título e subtítulo na mesma linha**, separados por ponto interpunto `·`. Subtitle `text-text-secondary truncate`.
2. **GlobalTools sempre à direita da Row 1** (a menos que `hideGlobalTools`). Importa de `layout/GlobalTools`.
3. **Filters à esquerda + Actions à direita** da Row 2.
4. **Responsivo**: abaixo de `lg`, linhas continuam mas empilham em colunas.

### Quando criar uma nova tela

```tsx
<PageHeader
  title={
    <span className="inline-flex items-center gap-2">
      Entregas
      <Badge>Beta</Badge>      // opcional
    </span>
  }
  subtitle={pagination ? `${total} entregas` : undefined}
  filters={
    <>
      <Button variant="secondary" leadingIcon={<Filter />}>Filtros</Button>
      <StatChip ... />
    </>
  }
  actions={
    <>
      <ColumnsMenu ... />       // se for lista
      <Button variant="secondary" leadingIcon={<Download />}>Exportar</Button>
      <Button leadingIcon={<Plus />}>Nova entrega</Button>
    </>
  }
/>
```

---

## 6. DataTable (`components/ui-v2/DataTable/DataTable.tsx`)

### 6.1 Capacidades

- **`table-layout: fixed` + `min-w-full`** — colunas com `size` explícito, soma > viewport gera scroll horizontal natural.
- **Zebra rows** com tom dedicado `--zebra-row`.
- **Header com border-bottom mais firme** (`border-border-strong`).
- **Sort controlado via prop** (`sorting` + `onSortingChange`). Default: `enableSortingRemoval: false` e `enableMultiSort: false` (toggle infinito asc↔desc).
- **Filtros por coluna** via prop `columnFilters: Record<id, ColumnFilterConfig>` (não pelo `meta`).
- **Loading bar fina no topo** durante refetch (estilo GitHub).
- **Skeleton só no primeiro load** (data vazia). Refetch mantém dados visíveis com `opacity-70`.
- **Footer (`tfoot`)** custom via prop `footer`.
- **Alignment**: `meta.align: 'center' | 'right'` (header + cell).
- **Wrap**: `meta.wrap: true` permite quebra de linha (default é `whitespace-nowrap` + truncate).

### 6.2 Props (essencial)

```ts
interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T, any>[]      // useMemo SEM filters como dep (evita stale closure)
  rowKey?: (row: T) => string | number
  loading?: boolean
  error?: string | null

  // Filtros por coluna (fora do useMemo de columns)
  columnFilters?: Record<string, ColumnFilterConfig>

  // Seleção
  selectable?: boolean
  selection?: RowSelectionState
  onSelectionChange?: (sel: RowSelectionState) => void

  // Sort (controlado)
  sorting?: SortingState
  onSortingChange?: (s: SortingState) => void

  // Paginação (controlada)
  pagination?: { page, pageSize, total, onPageChange, onPageSizeChange?, pageSizeOptions? }

  // UX
  onRowClick?: (row: T) => void
  empty?: ReactNode                  // empty state contextual (diferente quando há filtros vs não)
  footer?: ReactNode                 // tfoot, ex: total filtrado
  density?: 'compact' | 'comfortable'
}
```

### 6.3 Definição de coluna

```tsx
{
  id: 'code',                                    // id explícito (não só accessorKey)
  accessorKey: 'code',
  header: 'Código',
  size: 110,                                     // px
  enableSorting: false,                          // só ID ordena por padrão
  meta: { align: 'center' },                     // ou { wrap: true } pra coluna principal
  cell: ({ row }) => <span>...</span>
}
```

### 6.4 Coluna principal (texto livre)

```tsx
{
  id: 'title', accessorKey: 'title', header: 'Tarefa',
  size: 360,                                     // SEMPRE definir size — não confiar em "auto-fill"
  enableSorting: false,
  meta: { wrap: true },                          // permite quebra de linha multi-line
  cell: ...
}
```

### 6.5 Coluna de ações (sempre no final)

Padrão: **3 ícones inline + 1 dropdown `⋯`** (mais ações secundárias). Sem ícone "Ver" inline (clique na linha já visualiza).

```tsx
{
  id: '__actions', header: '', size: 170, enableSorting: false, meta: { align: 'center' },
  cell: ({ row }) => (
    <div className="flex items-center justify-center gap-0.5" onClick={(e) => e.stopPropagation()}>
      <Button size="icon-sm" variant="ghost" title="Editar"><Pencil /></Button>
      <Button size="icon-sm" variant="ghost" title="Exportar PDF" className="text-text-secondary hover:text-[var(--danger-strong)]"><PdfIcon /></Button>
      <Button size="icon-sm" variant="ghost" title="Excluir" className="text-text-secondary hover:text-[var(--danger-strong)]"><Trash2 /></Button>
      <DropdownMenu>
        <DropdownMenuTrigger><Button size="icon-sm" variant="ghost"><MoreHorizontal /></Button></DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>...</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem><Eye />Ver detalhes</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
```

### 6.6 Visibilidade de colunas (column toggle)

**Sempre que houver mais de 6-8 colunas potenciais.**

1. Definir `COLUMN_DEFS: { id, label, defaultVisible, locked? }[]` no topo do arquivo.
2. Local `columnVisibility` state + `localStorage` (chave `devquote.{módulo}.columns.v1`).
3. `<ColumnsMenu>` no PageHeader actions — Popover com checkboxes + 3 botões: **Restaurar padrão · Mostrar todas · Ocultar todas**.
4. Coluna principal de texto (Tarefa, Nome, etc.) deve ter `locked: true` (não pode esconder).
5. Build do array `columns` filtrado a partir de `allColumns` + `columnVisibility`.

### 6.7 Filtros por coluna (`ColumnFilterInput`)

**IMPORTANTE**: passar via prop `columnFilters` do DataTable, **NÃO** dentro de `meta` da column.

> Motivo: o `useMemo` de `columns` não inclui `filters` nas deps (perf). Se colocar `meta.filter.value` no useMemo, captura closure stale → input controlado pisca a cada keystroke.

```tsx
<DataTable
  columns={columns}                              // useMemo estável (deps fixas)
  columnFilters={{
    id: { type: 'number', value: filters.id ?? '', onChange: (v) => setFilter('id', v), placeholder: '#' },
    code: { value: filters.code ?? '', onChange: (v) => setFilter('code', v), placeholder: 'Código...' },
    flowType: {
      value: filters.flowType ?? '',
      onChange: (v) => setFilter('flowType', v),
      render: () => (                            // render custom pra Select com ícones
        <Select value={...} onValueChange={...}>
          <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Todos</SelectItem>
            <SelectItem value="DESENVOLVIMENTO">
              <span className="inline-flex items-center gap-1.5">
                <Monitor className="size-3.5 text-[var(--info-strong)]" />Desenvolvimento
              </span>
            </SelectItem>
            ...
          </SelectContent>
        </Select>
      )
    },
  }}
  sorting={tanstackSorting}
  onSortingChange={handleSortingChange}
  loading={loading}
  ...
/>
```

`ColumnFilterInput` recebe `loading` do DataTable e mostra `Loader2` spinning no canto direito quando há valor + loading=true.

### 6.8 Footer com totalizadores

```tsx
footer={(() => {
  const totalRows = pagination?.totalElements ?? tasks.length
  const hasActiveFilters = chips.length > 0
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
      <span><span className="text-text-tertiary">{hasActiveFilters ? 'Filtradas:' : 'Total:'}</span>{' '}
        <span className="font-medium text-text-primary tabular-nums">{totalRows.toLocaleString('pt-BR')}</span>
      </span>
      <span><span className="text-text-tertiary">{hasActiveFilters ? 'Soma filtrada:' : 'Soma total:'}</span>{' '}
        <span className="font-semibold tabular-nums">{brl(filteredTotal ?? 0)}</span>
      </span>
    </div>
  )
})()}
```

> Use endpoint backend dedicado pro total filtrado (ex: `/tasks/total-amount`). Client-side sum só funciona pra página atual.

### 6.9 Empty state contextual

```tsx
empty={
  chips.length > 0 ? (
    <EmptyState
      icon={<Filter />}
      title="Nenhuma tarefa com esses filtros"
      description="Ajuste os filtros aplicados ou limpe-os."
      actions={<>
        <Button variant="secondary" onClick={() => { setSearch(''); clearFilters() }}>Limpar filtros</Button>
        <Button leadingIcon={<Plus />}>Nova tarefa</Button>
      </>}
    />
  ) : (
    <EmptyState
      icon={<ListChecks />}
      title="Nenhuma tarefa"
      description="Você ainda não tem tarefas cadastradas."
      actions={<Button leadingIcon={<Plus />}>Nova tarefa</Button>}
    />
  )
}
```

---

## 7. Sheet de Filtros (filtros avançados)

Botão `[🔽 Filtros (N)]` na Row 2 abre Sheet lateral (`side="right"`, `max-w-md`) com **todas** as opções de filtro do backend, organizadas em seções.

### Seções padrão

1. **Identificação** — ID, Código, Link (URL)
2. **Conteúdo** — Título, Descrição
3. **Classificação** — Fluxo, Tipo, Ambiente (selects com ícones)
4. **Solicitante** — ID, Nome (grid 2 cols)
5. **Datas de criação** — De, Até (`<input type="date">`)
6. **Vínculos** — TriStateToggle (Possui entrega, Possui faturamento, Email financeiro)

### Componentes auxiliares

```tsx
<FilterSection title="Classificação">
  <FilterField label="Fluxo">
    <Select>...</Select>
  </FilterField>
</FilterSection>
```

### Tri-state toggle

```tsx
<TriStateToggle
  value={filters.hasDelivery as any}    // '' | 'true' | 'false'
  onChange={(v) => setFilter('hasDelivery', v)}
  onLabel="Com entrega"
  offLabel="Sem entrega"
/>
```

Botões: `[Qualquer] [Com entrega] [Sem entrega]` segmentados.

### Footer do Sheet

```tsx
<SheetFooter>
  <Button variant="ghost" onClick={() => { setSearch(''); clearFilters() }}>Limpar tudo</Button>
  <Button onClick={() => setFiltersOpen(false)}>Aplicar</Button>
</SheetFooter>
```

---

## 8. Chips de filtros ativos (`FilterChipsRow`)

Abaixo do PageHeader, antes da tabela. **Cada filtro ativo vira um chip** com `× remove individual` + botão `[Limpar todos]` quando há 2+.

```tsx
const chips: any[] = []
if (filters.id) chips.push({ key: 'id', label: 'ID', value: String(filters.id), onRemove: () => setFilter('id', '') })
if (filters.startDate) chips.push({ ...value: fmtDateBR(filters.startDate)... })  // DD/MM/YYYY no display
...

<FilterChipsRow chips={chips} onClearAll={() => { setSearch(''); clearFilters() }} />
```

> Datas sempre em **pt-BR** no display dos chips, mesmo armazenando ISO internamente. Use helper `fmtDateBR`.

---

## 9. Stats chips (atalhos visuais de filtro)

No Row 2 do PageHeader, antes ou depois do botão Filtros. Exibe contadores **globais** (todas as páginas, vindos do backend) que são **clicáveis** e ativam o filtro correspondente.

```tsx
<StatChip
  label="Sem entrega"
  value={stats?.totalWithoutDelivery}                       // do backend
  onClick={() => setFilter('hasDelivery', filters.hasDelivery === 'false' ? '' : 'false')}
  active={filters.hasDelivery === 'false'}
/>
```

- Vermelho preenchido quando há tarefas problemáticas
- Cinza neutro quando count = 0
- Ring vermelho mais forte quando o filtro está ativo (visual feedback)
- Toggle on/off no mesmo botão

### Endpoint backend

`GET /{entity}/stats` retorna `{ total, totalWithoutX, totalWithoutY, ... }`. Chamar sem filtros (sempre global).

---

## 10. Formulário (TaskForm pattern)

### Estrutura

```
┌────────────────────────────────────────────────────┐
│ <PageHeader title="Editar tarefa" subtitle=... />  │
├────────────────────────────────────────────────────┤
│ Solicitante inline (avatar + nome + telefone)      │
│                                         [Alterar]  │
├────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────┐ │
│ │ CLASSIFICAÇÃO                                  │ │
│ │ [Segmented: Desenvolvimento | Operacional]     │ │
│ │ Código · Prioridade · Tipo de Tarefa (3 cols)  │ │
│ │ Ambiente · Módulo · Servidor      (3 cols)     │ │
│ │ ────────────────────────────────────────────── │ │
│ │ CONTEÚDO                                       │ │
│ │ Título *                                       │ │
│ │ Descrição (TipTap minHeight=160px)             │ │
│ │ ────────────────────────────────────────────── │ │
│ │ LINKS                                          │ │
│ │ Link da tarefa · Link da reunião  (2 cols)     │ │
│ │ ────────────────────────────────────────────── │ │
│ │ COBRANÇA                                       │ │
│ │ ☐ Esta tarefa possui subtarefas                │ │
│ │   [SubTaskForm OU campo Valor]                 │ │
│ │ ────────────────────────────────────────────── │ │
│ │ ANEXOS [collapse]                              │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ ╔════════════════════════════════════════════════╗ │
│ ║ Sticky footer: [Cancelar]  [Salvar alterações] ║ │
│ ╚════════════════════════════════════════════════╝ │
└────────────────────────────────────────────────────┘
```

### Componentes auxiliares inline

```tsx
const FormSection = ({ title, description, children }) => (
  <section className="border-t border-border-subtle pt-6 first:border-t-0 first:pt-0">
    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">{title}</h2>
    {description && <p className="text-xs text-text-tertiary mt-0.5">{description}</p>}
    <div className="space-y-4 mt-4">{children}</div>
  </section>
)

const SegmentedFlow = ({ value, onChange }) => (
  <div role="radiogroup" className="inline-flex rounded-md border bg-surface-2 p-0.5">
    {/* Botões com ícone + label, active com bg-surface-1 + shadow */}
  </div>
)
```

### Selects com ícones consistentes

Use `ui-v2/Select` (Radix) com `<Controller>` do RHF. Coloca o ícone dentro de `SelectItem` e no `SelectValue` para refletir a opção atual.

```tsx
<Controller
  control={control}
  name="taskType"
  render={({ field }) => {
    const meta = field.value ? TASK_TYPE_META[field.value] : undefined
    return (
      <RSelect value={field.value || ''} onValueChange={field.onChange}>
        <RSelectTrigger>
          <RSelectValue placeholder="Selecione…">
            {field.value && meta ? (
              <span className="inline-flex items-center gap-1.5">
                <meta.Icon className={cn('size-3.5', meta.iconClass)} />
                {meta.label}
              </span>
            ) : 'Selecione…'}
          </RSelectValue>
        </RSelectTrigger>
        <RSelectContent>
          {taskTypeOptions.map((o) => {
            const m = TASK_TYPE_META[o.value]
            return (
              <RSelectItem key={o.value} value={o.value}>
                <span className="inline-flex items-center gap-1.5">
                  {m?.Icon && <m.Icon className={cn('size-3.5', m?.iconClass)} />}
                  {o.label}
                </span>
              </RSelectItem>
            )
          })}
        </RSelectContent>
      </RSelect>
    )
  }}
/>
```

### Sticky footer

```tsx
<div className="sticky bottom-0 -mx-3 sm:-mx-4 lg:-mx-4 mt-6 px-3 sm:px-4 lg:px-4 py-3 bg-surface-app/95 backdrop-blur border-t border-border-subtle z-20">
  <div className="flex items-center justify-end gap-2">
    {onCancel && <Button variant="secondary" onClick={onCancel}>Cancelar</Button>}
    <Button type="submit" loading={isSubmitting}>
      {isEdit ? 'Salvar alterações' : 'Criar tarefa'}
    </Button>
  </div>
</div>
```

### Tratamento de erros

1. **Validação local (Yup)** → `methods.handleSubmit(onValid, onInvalid)`. `onInvalid` mostra primeiro erro num toast + scroll pro topo. Erros inline já aparecem abaixo de cada campo.
2. **Erro do backend** → catch no `onSubmit`. Se for erro conhecido (ex: `DUPLICATE_TASK_CODE`), aplica `methods.setError('code', { message })` no campo + foco. Caso contrário, banner de erro no topo do form.
3. **NUNCA reset() no erro.** Só após sucesso (e mesmo assim só pra criação, não edição).
4. **Toast vem do hook** (`useTasks.createTaskWithSubTasks` já toasta). Não duplicar no TaskForm.
5. **Página pai (TaskCreate/Edit) DEVE rethrow** o erro pro form capturar. Não engolir com `catch (e) {}`.

### Banner de erro

```tsx
{formError && (
  <div className="mb-6 flex gap-3 rounded-md border border-danger-border bg-danger-soft p-4">
    <AlertCircle className="size-5 text-[var(--danger-strong)]" />
    <div className="flex-1">
      <p className="text-sm font-medium text-[var(--danger-strong)]">Erro ao processar</p>
      <p className="mt-1 text-sm">{formError}</p>
    </div>
    <button onClick={() => setFormError(null)}>Fechar</button>
  </div>
)}
```

---

## 11. View pages (TaskView pattern)

### Estrutura

```
┌──────────────────────────────────────────────────────┐
│ <PageHeader                                          │
│   title="Tarefa #444 (badge)" subtitle="N6E2U2 · ..."│
│   actions={<Button leadingIcon={<Edit3/>}>Editar</>} │
│ />                                                    │
├──────────────────────────────────────────────────────┤
│ Chips compactos: Fluxo, Tipo, Ambiente, Prioridade   │
│                                          Valor Total │
├──────────────────────────────────────────────────────┤
│ Card único com sections (igual ao form):             │
│  - Conteúdo (título + descrição em prose)            │
│  - Operacional (módulo, servidor)                    │
│  - Links (com botão copiar)                          │
│  - Subtarefas (lista compacta numerada)              │
│  - Anexos (collapse)                                 │
│  - Auditoria (criada/atualizada · por)               │
└──────────────────────────────────────────────────────┘
```

### Auxiliares

```tsx
const Section = ({ title, children }) => (
  <section className="border-t border-border-subtle pt-6 first:border-t-0 first:pt-0">
    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-4">{title}</h2>
    <div className="space-y-4">{children}</div>
  </section>
)

const InfoField = ({ label, children }) => (
  <div>
    <p className="text-xs text-text-tertiary mb-0.5">{label}</p>
    <div className="text-sm text-text-primary">{children}</div>
  </div>
)
```

### Botão de copiar (ícone discreto)

```tsx
<button
  onClick={() => copy(value, fieldId)}
  className={cn(
    'p-1.5 rounded transition-colors',
    copied === fieldId ? 'bg-success-soft text-[var(--success-strong)]' : 'text-text-tertiary hover:bg-surface-2'
  )}
>
  {copied === fieldId ? <Check /> : <Copy />}
</button>
```

> Sem fundo cinza grande. Vira verde quando copiado por 2s.

---

## 12. Status & Pills

### StatusPill (Sem entrega/Sem fatura)

Vermelho preenchido quando o estado é "ruim", verde/azul quando "ok". Bem destacado visualmente.

```tsx
<StatusPill
  on={!!hasDelivery}
  onLabel="Entrega"
  offLabel="Sem entrega"
  tone="info"     // 'info' | 'success'
/>
```

- **on**: `✓ Entrega` (azul) ou `✓ Faturado` (verde)
- **off**: `✕ Sem entrega` ou `✕ Sem fatura` (vermelho preenchido, alto destaque)

### FlowChip · TaskTypeLabel · EnvLabel

Centralize **uma vez** a relação `valor → { label, Icon, iconClass }` em arquivos de componente reutilizáveis:

```tsx
// FlowChip.tsx
export const FLOW_LABEL = { DESENVOLVIMENTO: 'Desenvolvimento', OPERACIONAL: 'Operacional' }
export const FlowChip = ({ value }) => {
  if (value === 'DESENVOLVIMENTO') return <Pill bg="info-soft" icon={<Monitor />}>...</Pill>
  // ...
}

// TaskTypeLabel.tsx
export const TASK_TYPE_META = { BUG: { label, Icon: Bug, iconClass: 'text-[var(--success-strong)]' }, ... }
export const TaskTypeLabel = ({ value }) => { ... }

// EnvLabel.tsx
export const ENV_META = { DESENVOLVIMENTO: { Icon: Code2, ... }, ... }
```

**Importante**: `ENV_OPTIONS` no TaskList deve usar os **mesmos valores** que `ENV_META` (`DESENVOLVIMENTO/HOMOLOGACAO/PRODUCAO`, **não** `DEV/HML/PROD` — bateria com o enum backend).

---

## 13. Mobile (dual desktop/mobile)

Páginas de listagem têm **duas implementações** na mesma tela:

```tsx
<div className="hidden lg:block"> <DataTable ... /> </div>
<div className="lg:hidden space-y-2"> {items.map(...<Card />)} </div>
```

**Mexeu numa, tem que mexer na outra.** Cards mobile devem ter:
- Header: `#id · código (link se houver) · valor`
- Title (área clicável → navigate)
- Chips (FlowChip + StatusPill x2)
- Requester (linha pequena)
- Footer com mesma divisão `<div className="border-t">` + ações em `<DropdownMenu>` "..." (mais compacto que ícones individuais)

---

## 14. Hooks

### `useTasks` (e similares) — comportamentos esperados

- `filters` é `Record<string, string | undefined>`. `setFilter(field, '')` remove a chave.
- `setFilter` reseta `currentPage = 0`.
- `useEffect` com debounce 300ms refaz fetch quando filtros/sort/page mudam.
- Datas: aceita `YYYY-MM-DD` (do `<input type="date">`) e `DD/MM/YYYY` (chips/digitação). Normaliza pra ISO antes de enviar.
- Toast.success em criar/editar/excluir bem-sucedidos. Toast.error em erros do backend. **Rethrow obrigatório** após o toast.

### `useTheme`

3 valores: `light` | `dim` | `dark` (+ `system`). Default: `light`. Persiste em `devquote.theme`.

---

## 15. Backend (endpoints esperados por entidade)

Para uma entidade `X` com `/api/x`:

| Endpoint | Uso |
|---|---|
| `GET /x` | Paginado + 14+ filtros. Resposta: `PagedResponse<XResponse>` |
| `GET /x/{id}` | Detalhe |
| `POST /x` | Criar |
| `PUT /x/{id}` | Atualizar |
| `DELETE /x/{id}` | Excluir |
| `DELETE /x/bulk` (body: `[ids]`) | Bulk delete |
| `GET /x/stats` | Contadores globais (`total`, `totalWithoutY`, ...) — para StatChips |
| `GET /x/total-amount?<filters>` | Soma agregada com filtros — para footer da tabela |
| `GET /x/export/excel` | Export |

### Padrão dos filtros no controller

```java
@RequestParam(required = false) Long id,
@RequestParam(required = false) String code,
@RequestParam(required = false) String title,
// ... todos os filtros expostos no Sheet
@RequestParam(required = false) Boolean hasDelivery,
@RequestParam(required = false) Boolean hasQuoteInBilling,
```

### Padrão do filtro no repository

```sql
WHERE (:id IS NULL OR x.id = :id)
  AND (:title IS NULL OR :title = '' OR LOWER(x.title) LIKE LOWER(CONCAT('%', :title, '%')))
  AND (:startDate IS NULL OR :startDate = '' OR CAST(x.createdAt AS date) >= CAST(:startDate AS date))
  AND (:hasY IS NULL
       OR (:hasY = TRUE  AND EXISTS (SELECT 1 FROM ...))
       OR (:hasY = FALSE AND NOT EXISTS (SELECT 1 FROM ...)))
```

> Esses padrões já estão no `TaskRepository.findByOptionalFieldsPaginated` e `sumAmountByOptionalFields`. Copiar.

---

## 16. Persistência (localStorage keys)

| Chave | Conteúdo |
|---|---|
| `devquote.theme` | `'light' \| 'dim' \| 'dark' \| 'system'` |
| `devquote.sidebar.collapsed` | `'0' \| '1'` |
| `devquote.tasks.columns.v1` | `Record<columnId, boolean>` (visibilidade de colunas) |

Pra cada nova listagem com column toggle, use chave `devquote.{módulo}.columns.v1`.

---

## 17. Atalhos de teclado (existentes — manter)

| Tecla | Ação |
|---|---|
| `⌘K / Ctrl+K` | Command palette |
| `⌘N / Ctrl+N` | Criar contextual |
| `G D / G T / G E / G F` | Ir pra Dashboard / Tarefas / Entregas / Faturamento |
| `[` | Toggle sidebar |
| `Esc` | Fecha modais/sheets |

---

## 18. Padrões a evitar

❌ **Card grande com header próprio** dentro do conteúdo (PageHeader já faz o papel)
❌ **`Voltar` isolado** numa linha (sticky footer já tem Cancelar)
❌ **Emoji em selects/labels** (`🐛 Bug`, `🟡 Média`) — use ícones lucide
❌ **`min-h-screen bg-surface-app py-4 px-* lg:px-8`** em wrappers de página — Layout já cuida
❌ **`mx-auto max-w-Xxl`** no conteúdo — usar largura total
❌ **`useMemo(columns, [navigate, canCRUD])`** com `filters.x` lido dentro — closure stale
❌ **Skeleton total em refetch** — só no initial load
❌ **Soma client-side** vendida como "total filtrado" — usar backend
❌ **Headers `UPPERCASE TRACKING-WIDE`** dentro do conteúdo — só em labels de section
❌ **Catch silencioso na página** — sempre rethrow pro form/hook reagir

---

## 19. Checklist pra nova tela de listagem

- [ ] Hook `use{Modulo}` com `filters`, `setFilter`, `clearFilters`, `sorting`, `setSorting`, paginação, debounce 300ms
- [ ] Service `{modulo}Service.getStats()` (global counts) e `getTotalAmount(filters)` (sum filtrado), se tiver coluna de valor
- [ ] `COLUMN_DEFS` no topo do arquivo (id, label, defaultVisible, locked)
- [ ] `allColumns: ColumnDef[]` em useMemo com deps **estáveis** (não inclui filters)
- [ ] `columns` derivado de `allColumns` + `columnVisibility` (também useMemo)
- [ ] `columnFilters: Record<columnId, ColumnFilterConfig>` passado fresh ao DataTable
- [ ] Adapter `tanstackSorting` ↔ `useTasks.sorting` (formatos diferentes)
- [ ] PageHeader com title+subtitle inline, filters (Filtros button + StatChips), actions (ColumnsMenu + Export + Nova)
- [ ] `FilterChipsRow` com chips dos filtros ativos (formato pt-BR pra datas)
- [ ] `ColumnsMenu` (Popover com checkboxes + Restaurar padrão)
- [ ] Sheet de filtros completo (Identificação, Conteúdo, Classificação, Vínculos, Datas)
- [ ] StatChips clicáveis (toggle filtro)
- [ ] DataTable com `loading`, `sorting`, `columnFilters`, `pagination`, `empty` contextual, `footer` total
- [ ] Versão mobile (cards `lg:hidden`)
- [ ] Persistência de columnVisibility em localStorage com chave versionada
- [ ] Componentes específicos do módulo (chips/labels com ícones) em `components/{modulo}/`
- [ ] Default page size 100

---

## 20. Checklist pra nova tela de form (criar/editar)

- [ ] PageHeader com title (badge `#id` se editar) + subtitle (nome/título) + actions opcionais
- [ ] Seletor de Solicitante (ou similar) **inline horizontal** — avatar + nome + telefone + botão Alterar
- [ ] `FormSection` por agrupamento lógico (Classificação, Conteúdo, Links, Cobrança, Anexos)
- [ ] Segmented control pra Fluxo/Tipo binário
- [ ] Selects com ícones (Tipo, Ambiente, Prioridade) — usar `ui-v2/Select`
- [ ] `<input type="date">` pra datas (não picker custom)
- [ ] TipTap editor `minHeight: 160px`, hint via placeholder
- [ ] Sticky footer com Cancelar + Salvar
- [ ] Banner de erro inline (sem reset do form)
- [ ] Toast complementar pra validação local
- [ ] Erros conhecidos → `setError(field, ...)` no campo específico
- [ ] Página pai rethrow do erro

---

## 21. Checklist pra nova tela de view

- [ ] PageHeader com title (badge `#id`) + subtitle + actions (Editar)
- [ ] Chips compactos numa linha (Fluxo + Tipo + Ambiente + Prioridade) + Valor à direita
- [ ] Card único com `Section`s (Conteúdo, Operacional, Links, Subtarefas, Anexos, Auditoria)
- [ ] `InfoField` pra cada campo (label small + valor)
- [ ] Botão copiar discreto em links
- [ ] Lista de subtarefas compacta numerada com count por padrão (não cards grandes)
- [ ] Mesmos chips/labels da listagem (FlowChip, TaskTypeLabel, EnvLabel)

---

## 22. Bugs frequentes (e como resolver)

| Sintoma | Causa | Fix |
|---|---|---|
| Input controlado pisca a cada keystroke | Closure stale — `meta.filter.value` no useMemo de columns | Mover pra prop `columnFilters` fora do useMemo |
| Form reseta no erro | TaskCreate.handleSubmit engole o erro | Rethrow no catch |
| Filtro `DEV/HML/PROD` não filtra | Valores não batem com enum backend (`DESENVOLVIMENTO/...`) | Padronizar pelo backend |
| Date filter retorna 409 | `convertDateFormat` espera DD/MM/YYYY mas recebe YYYY-MM-DD | Aceitar ambos e normalizar pra ISO |
| Coluna principal vira 1 char por linha | `table-fixed` + sum widths > viewport + col sem size | Setar `size` mínimo na coluna principal + `min-w-full` no table |
| Sort não funciona | Página não passa sorting/onSortingChange ao DataTable | Adapter `tanstackSorting` ↔ formato do hook |
| Sort clica e não volta | TanStack vai pra "no sort" no 3º clique | `enableSortingRemoval: false` no useReactTable |

---

## Versionamento

Doc inicial: 2026-05-19. Atualize ao introduzir novos padrões.
