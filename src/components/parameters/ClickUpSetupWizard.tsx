import * as React from 'react'
import { toast } from 'react-hot-toast'
import { CheckCircle2, Loader2, AlertCircle, ChevronRight, Eye, EyeOff } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter,
} from '@/components/ui-v2/Sheet'
import { Button } from '@/components/ui-v2/Button'
import { Input } from '@/components/ui-v2/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui-v2/Select'
import {
  clickupSetupService,
  ClickUpSetupItem,
  ClickUpSetupUser,
  ClickUpFieldsResponse,
} from '@/services/clickupSetupService'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

type Step = 1 | 2 | 3 | 4 | 5 | 6

const TOTAL_STEPS = 6

const STEP_LABELS: Record<Step, string> = {
  1: 'Token',
  2: 'Workspace',
  3: 'Space',
  4: 'Lista',
  5: 'Campos',
  6: 'Resumo',
}

export const ClickUpSetupWizard: React.FC<Props> = ({ open, onOpenChange, onSaved }) => {
  const [step, setStep] = React.useState<Step>(1)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Estado do wizard
  const [token, setToken] = React.useState('')
  const [showToken, setShowToken] = React.useState(false)
  const [user, setUser] = React.useState<ClickUpSetupUser | null>(null)

  const [workspaces, setWorkspaces] = React.useState<ClickUpSetupItem[]>([])
  const [workspaceId, setWorkspaceId] = React.useState<string>('')

  const [spaces, setSpaces] = React.useState<ClickUpSetupItem[]>([])
  const [spaceId, setSpaceId] = React.useState<string>('')
  /** Lists compartilhadas com o user no workspace (Shared with me). */
  const [sharedLists, setSharedLists] = React.useState<ClickUpSetupItem[]>([])

  const [lists, setLists] = React.useState<ClickUpSetupItem[]>([])
  const [listId, setListId] = React.useState<string>('')

  const [fields, setFields] = React.useState<ClickUpFieldsResponse | null>(null)
  const [developerFieldId, setDeveloperFieldId] = React.useState<string>('')
  const [developerOptionId, setDeveloperOptionId] = React.useState<string>('')
  const [orderFieldId, setOrderFieldId] = React.useState<string>('')

  // Reset ao abrir/fechar
  React.useEffect(() => {
    if (!open) return
    setStep(1)
    setError(null)
    setToken('')
    setShowToken(false)
    setUser(null)
    setWorkspaces([])
    setWorkspaceId('')
    setSpaces([])
    setSpaceId('')
    setSharedLists([])
    setLists([])
    setListId('')
    setFields(null)
    setDeveloperFieldId('')
    setDeveloperOptionId('')
    setOrderFieldId('')
  }, [open])

  // Helpers
  const apiError = (e: any, fallback: string) => {
    const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || fallback
    setError(msg)
  }
  const clearError = () => setError(null)

  // ===================== Ações por etapa =====================

  const handleValidateToken = async () => {
    if (!token.trim()) {
      setError('Cole o token do ClickUp.')
      return
    }
    clearError()
    setLoading(true)
    try {
      const u = await clickupSetupService.validateToken(token.trim())
      setUser(u)
      // já busca workspaces pra agilizar
      const ws = await clickupSetupService.listWorkspaces(token.trim())
      setWorkspaces(ws)
      if (ws.length === 1) {
        setWorkspaceId(ws[0].id)
      }
      setStep(2)
    } catch (e: any) {
      apiError(e, 'Token inválido ou falha na conexão com o ClickUp')
    } finally {
      setLoading(false)
    }
  }

  const handleAdvanceFromWorkspaces = async () => {
    if (!workspaceId) {
      setError('Selecione um workspace.')
      return
    }
    clearError()
    setLoading(true)
    try {
      // Busca spaces normais + shared lists em paralelo
      const [sp, shared] = await Promise.all([
        clickupSetupService.listSpaces(token.trim(), workspaceId),
        clickupSetupService.listSharedLists(token.trim(), workspaceId).catch(() => [] as ClickUpSetupItem[]),
      ])
      setSpaces(sp)
      setSharedLists(shared)
      // Auto-seleção: se só houver 1 opção (1 space ou só shared), pré-seleciona
      const hasShared = shared.length > 0
      if (sp.length === 1 && !hasShared) setSpaceId(sp[0].id)
      else if (sp.length === 0 && hasShared) setSpaceId('__shared__')
      setStep(3)
    } catch (e: any) {
      apiError(e, 'Falha ao listar spaces')
    } finally {
      setLoading(false)
    }
  }

  const handleAdvanceFromSpaces = async () => {
    if (!spaceId) {
      setError('Selecione um space.')
      return
    }
    clearError()
    setLoading(true)
    try {
      // Se selecionou o "space sintético" das compartilhadas, usa direto a lista shared
      if (spaceId === '__shared__') {
        setLists(sharedLists)
      } else {
        const ls = await clickupSetupService.listLists(token.trim(), spaceId)
        setLists(ls)
      }
      setStep(4)
    } catch (e: any) {
      apiError(e, 'Falha ao listar lists')
    } finally {
      setLoading(false)
    }
  }

  const handleAdvanceFromLists = async () => {
    if (!listId) {
      setError('Selecione uma lista.')
      return
    }
    clearError()
    setLoading(true)
    try {
      const f = await clickupSetupService.listFields(token.trim(), listId)
      setFields(f)
      setDeveloperFieldId(f.suggestedDeveloperFieldId || '')
      setDeveloperOptionId(f.suggestedDeveloperOptionId || '')
      setOrderFieldId(f.suggestedOrderFieldId || '')
      setStep(5)
    } catch (e: any) {
      apiError(e, 'Falha ao listar campos da lista')
    } finally {
      setLoading(false)
    }
  }

  const handleAdvanceFromFields = () => {
    if (!developerFieldId) {
      setError('Escolha o campo Desenvolvedor.')
      return
    }
    if (!developerOptionId) {
      setError('Escolha a sua opção dentro do campo Desenvolvedor.')
      return
    }
    clearError()
    setStep(6)
  }

  const handleSave = async () => {
    clearError()
    setLoading(true)
    try {
      await clickupSetupService.save({
        token: token.trim(),
        listId,
        developerFieldId,
        developerOptionId,
        orderFieldId: orderFieldId || null,
      })
      toast.success('Configuração do ClickUp salva!')
      onSaved?.()
      onOpenChange(false)
    } catch (e: any) {
      apiError(e, 'Falha ao salvar configuração')
    } finally {
      setLoading(false)
    }
  }

  // ===================== Render =====================

  const selectedDeveloperField = fields?.all.find((f) => f.id === developerFieldId)
  const selectedDeveloperOption = selectedDeveloperField?.options?.find((o) => o.id === developerOptionId)
  const selectedOrderField = fields?.all.find((f) => f.id === orderFieldId)
  const selectedList = lists.find((l) => l.id === listId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="md">
        <SheetHeader>
          <SheetTitle>Configurar integração ClickUp</SheetTitle>
          <SheetDescription>
            Conecte com o seu ClickUp em alguns cliques. O sistema descobre os campos automaticamente.
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <Stepper current={step} />

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-[var(--danger-border)] bg-danger-soft p-3 text-sm text-[var(--danger-strong)]">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ============ Step 1: Token ============ */}
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Token pessoal do ClickUp</label>
                <Input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  type={showToken ? 'text' : 'password'}
                  placeholder="pk_xxxxxxx_xxxxxxxxxxxxxx"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  trailingIcon={
                    <button
                      type="button"
                      onClick={() => setShowToken((v) => !v)}
                      className="text-text-tertiary hover:text-text-primary"
                      aria-label={showToken ? 'Ocultar' : 'Mostrar'}
                    >
                      {showToken ? <EyeOff /> : <Eye />}
                    </button>
                  }
                  onKeyDown={(e) => { if (e.key === 'Enter') handleValidateToken() }}
                />
                <p className="mt-1 text-xs text-text-tertiary">
                  ClickUp → avatar → Configurações → Apps → Gerar API Token. Começa com <code>pk_</code>.
                </p>
              </div>
            </div>
          )}

          {/* ============ Step 2: Workspace ============ */}
          {step === 2 && user && (
            <div className="space-y-4">
              <ConnectedBanner user={user} />
              <Field label="Workspace">
                <Select value={workspaceId} onValueChange={setWorkspaceId}>
                  <SelectTrigger><SelectValue placeholder={workspaces.length === 0 ? 'Nenhum workspace' : 'Selecionar...'} /></SelectTrigger>
                  <SelectContent>
                    {workspaces.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {workspaces.length === 1 && (
                <p className="text-xs text-text-tertiary">Você tem 1 workspace — já está selecionado.</p>
              )}
            </div>
          )}

          {/* ============ Step 3: Space ============ */}
          {step === 3 && (
            <div className="space-y-4">
              <Field label="Space">
                <Select value={spaceId} onValueChange={setSpaceId}>
                  <SelectTrigger>
                    <SelectValue placeholder={spaces.length === 0 && sharedLists.length === 0 ? 'Nenhum space' : 'Selecionar...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {spaces.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                    {sharedLists.length > 0 && (
                      <SelectItem value="__shared__">
                        Compartilhadas comigo ({sharedLists.length})
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {spaces.length === 0 && sharedLists.length > 0 && (
                  <p className="mt-1 text-xs text-text-tertiary">
                    Você não é membro de nenhum space neste workspace, mas há listas compartilhadas com você. Use "Compartilhadas comigo".
                  </p>
                )}
              </Field>
            </div>
          )}

          {/* ============ Step 4: List ============ */}
          {step === 4 && (
            <div className="space-y-4">
              <Field label="Lista do board">
                <Select value={listId} onValueChange={setListId}>
                  <SelectTrigger><SelectValue placeholder={lists.length === 0 ? 'Nenhuma lista' : 'Selecionar...'} /></SelectTrigger>
                  <SelectContent>
                    {lists.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.parent ? `${l.parent} / ${l.name}` : l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-text-tertiary">
                  Esta é a lista cujas tarefas vão aparecer na tela /priorities.
                </p>
              </Field>
            </div>
          )}

          {/* ============ Step 5: Fields ============ */}
          {step === 5 && fields && (
            <div className="space-y-5">
              <FieldsBanner suggested={!!fields.suggestedDeveloperFieldId} />

              <Field label="Campo Desenvolvedor (drop_down)">
                <Select value={developerFieldId} onValueChange={(v) => { setDeveloperFieldId(v); setDeveloperOptionId('') }}>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    {fields.all.filter((f) => f.type === 'drop_down').map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {developerFieldId && selectedDeveloperField?.options && selectedDeveloperField.options.length > 0 && (
                <Field label="Sua opção (Wesley/João/etc.)">
                  <Select value={developerOptionId} onValueChange={setDeveloperOptionId}>
                    <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent>
                      {selectedDeveloperField.options.map((o) => (
                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}

              <Field label="Campo Ordem (opcional — number)">
                <Select value={orderFieldId || '__none'} onValueChange={(v) => setOrderFieldId(v === '__none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">— Sem ordenação custom —</SelectItem>
                    {fields.all.filter((f) => f.type === 'number').map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-text-tertiary">
                  Se a sua lista tem um campo numérico pra priorização, selecione aqui.
                </p>
              </Field>
            </div>
          )}

          {/* ============ Step 6: Resumo ============ */}
          {step === 6 && user && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-text-secondary mb-2">
                  <strong className="text-text-primary">Configuração principal</strong>{' '}
                  <span className="text-text-tertiary">(sobrescreve se já existir)</span>
                </p>
                <ul className="rounded-md border border-border-subtle bg-surface-app/40 p-3 space-y-1.5 text-sm font-mono">
                  <Summary k="CLICKUP_INTEGRATION_ENABLED" v="true" />
                  <Summary k="CLICKUP_TOKEN" v={maskToken(token)} />
                  <Summary k="CLICKUP_BOARD_LIST_ID" v={listId} hint={selectedList?.name} />
                  <Summary k="CLICKUP_DEVELOPER_FIELD_ID" v={developerFieldId} hint={selectedDeveloperField?.name} />
                  <Summary k="CLICKUP_DEVELOPER_OPTION_ID" v={developerOptionId} hint={selectedDeveloperOption?.name} />
                  {orderFieldId && <Summary k="CLICKUP_ORDER_FIELD_ID" v={orderFieldId} hint={selectedOrderField?.name} />}
                </ul>
              </div>

              <div>
                <p className="text-sm text-text-secondary mb-2">
                  <strong className="text-text-primary">Opcionais com defaults</strong>{' '}
                  <span className="text-text-tertiary">(só cria se não existir; preserva customizações)</span>
                </p>
                <ul className="rounded-md border border-border-subtle bg-surface-app/40 p-3 space-y-1.5 text-sm font-mono">
                  <Summary k="TASK_BOARD_PROVIDER" v="CLICKUP" />
                  <Summary k="CLICKUP_PRIMARY_STATUS" v="a iniciar - dev interno" />
                  <Summary k="CLICKUP_PRIORITY_STATUSES" v="a iniciar - dev interno,em progresso,..." hint="8 status" />
                  <Summary k="CLICKUP_BOARD_ASSIGNEE_USER_ID" v="(vazio)" hint="auto-detect via token" />
                  <Summary k="CLICKUP_HIDDEN_STATUSES" v="complete,concluído" hint="esconde finalizados" />
                </ul>
              </div>

              <p className="text-xs text-text-tertiary">
                Após salvar, o cache do board é invalidado automaticamente. Pode abrir <code>/priorities</code> em seguida.
                Você pode ajustar qualquer um desses parâmetros depois em <code>/parameters</code>.
              </p>
            </div>
          )}
        </SheetBody>

        <SheetFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {step > 1 && step < 6 && (
            <Button variant="secondary" onClick={() => setStep((s) => (s - 1) as Step)} disabled={loading}>
              Voltar
            </Button>
          )}
          {step === 6 && (
            <Button variant="secondary" onClick={() => setStep(5)} disabled={loading}>Voltar</Button>
          )}

          {step === 1 && <Button onClick={handleValidateToken} loading={loading} trailingIcon={<ChevronRight />}>Validar e continuar</Button>}
          {step === 2 && <Button onClick={handleAdvanceFromWorkspaces} loading={loading} trailingIcon={<ChevronRight />} disabled={!workspaceId}>Próximo</Button>}
          {step === 3 && <Button onClick={handleAdvanceFromSpaces} loading={loading} trailingIcon={<ChevronRight />} disabled={!spaceId}>Próximo</Button>}
          {step === 4 && <Button onClick={handleAdvanceFromLists} loading={loading} trailingIcon={<ChevronRight />} disabled={!listId}>Próximo</Button>}
          {step === 5 && <Button onClick={handleAdvanceFromFields} trailingIcon={<ChevronRight />}>Próximo</Button>}
          {step === 6 && <Button onClick={handleSave} loading={loading} leadingIcon={<CheckCircle2 />}>Salvar e ativar</Button>}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

/* =================== Subcomponentes =================== */

const Stepper: React.FC<{ current: Step }> = ({ current }) => (
  <div className="mb-5 flex items-center gap-1.5">
    {Array.from({ length: TOTAL_STEPS }, (_, i) => {
      const n = (i + 1) as Step
      const done = n < current
      const active = n === current
      return (
        <React.Fragment key={n}>
          <div
            className={
              'inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ' +
              (done
                ? 'bg-accent text-accent-fg'
                : active
                  ? 'bg-accent/15 text-accent border border-accent'
                  : 'bg-surface-2 text-text-tertiary')
            }
            title={STEP_LABELS[n]}
          >
            {done ? <CheckCircle2 className="size-3.5" /> : n}
          </div>
          {n < TOTAL_STEPS && (
            <div className={'h-px flex-1 ' + (done ? 'bg-accent' : 'bg-border-subtle')} />
          )}
        </React.Fragment>
      )
    })}
  </div>
)

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-text-secondary mb-1.5">{label}</label>
    {children}
  </div>
)

const ConnectedBanner: React.FC<{ user: ClickUpSetupUser }> = ({ user }) => (
  <div className="flex items-center gap-2 rounded-md border border-[var(--success-border)] bg-success-soft p-3 text-sm">
    <CheckCircle2 className="size-4 text-[var(--success-strong)]" />
    <div className="min-w-0">
      <div className="font-medium text-text-primary">Conectado como {user.username}</div>
      <div className="text-xs text-text-tertiary truncate">{user.email}</div>
    </div>
  </div>
)

const FieldsBanner: React.FC<{ suggested: boolean }> = ({ suggested }) => (
  <div className={'flex items-start gap-2 rounded-md border p-3 text-sm ' + (suggested
      ? 'border-[var(--success-border)] bg-success-soft'
      : 'border-[var(--warning-border)] bg-warning-soft')}>
    {suggested ? <CheckCircle2 className="size-4 mt-0.5 text-[var(--success-strong)]" /> : <AlertCircle className="size-4 mt-0.5 text-[var(--warning-strong)]" />}
    <div className="text-text-primary">
      {suggested
        ? 'Auto-detect funcionou — os campos abaixo já vêm pré-selecionados. Confira e ajuste se precisar.'
        : 'Não consegui detectar automaticamente os campos. Selecione manualmente abaixo.'}
    </div>
  </div>
)

const Summary: React.FC<{ k: string; v: string; hint?: string }> = ({ k, v, hint }) => (
  <li className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
    <span className="text-text-tertiary text-xs shrink-0">{k}</span>
    <span className="text-text-primary break-all">
      = {v}
      {hint && <span className="text-text-tertiary text-xs not-italic ml-1.5">({hint})</span>}
    </span>
  </li>
)

function maskToken(token: string): string {
  if (!token) return ''
  if (token.length <= 8) return '***'
  return token.slice(0, 4) + '*'.repeat(8) + token.slice(-4)
}

export default ClickUpSetupWizard
