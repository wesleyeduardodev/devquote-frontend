# Sistema de Segurança Frontend - Guia de Integração

Este documento explica como integrar o novo sistema de segurança baseado em RBAC no frontend.

## 📋 Visão Geral

O sistema implementa controle de acesso baseado em:
- **Perfis**: ADMIN, MANAGER, USER
- **Telas**: dashboard, tasks, projects, quotes, deliveries, billing, users, reports, settings
- **Operações**: CREATE, READ, UPDATE, DELETE, BULK
- **Campos**: READ, EDIT, HIDDEN

## 🔐 Componentes Principais

### 1. AuthProvider
Wrappe toda a aplicação fornecendo contexto de autenticação:

```tsx
import { AuthProvider } from '@/hooks/useAuth';

function App() {
  return (
    <AuthProvider>
      {/* Sua aplicação */}
    </AuthProvider>
  );
}
```

### 2. ProtectedRoute
Protege rotas baseado em autenticação e telas:

```tsx
import ProtectedRoute from '@/components/ProtectedRoute';

// Proteger apenas por autenticação
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Proteger por tela específica
<ProtectedRoute requiredScreen="billing">
  <BillingPage />
</ProtectedRoute>

// Proteger por múltiplas telas (qualquer uma)
<ProtectedRoute requiredScreens={["reports", "billing"]}>
  <FinancialDashboard />
</ProtectedRoute>

// Proteger por múltiplas telas (todas obrigatórias)
<ProtectedRoute requiredScreens={["users", "settings"]} requireAllScreens>
  <AdminPanel />
</ProtectedRoute>
```

### 3. ScreenGuard
Protege conteúdo baseado em acesso a telas:

```tsx
import { ScreenGuard, AccessDenied } from '@/components/auth';

function MyComponent() {
  return (
    <ScreenGuard 
      requiredScreen="billing"
      fallback={<AccessDenied message="Acesso ao faturamento negado" />}
    >
      <BillingContent />
    </ScreenGuard>
  );
}
```

### 4. ResourceGuard
Protege conteúdo baseado em operações:

```tsx
import { ResourceGuard, ProtectedButton } from '@/components/auth';

function TaskList() {
  return (
    <div>
      {/* Só mostra se pode criar tarefas */}
      <ResourceGuard resource="tasks" operation="CREATE">
        <Button>Nova Tarefa</Button>
      </ResourceGuard>

      {/* Botão que desabilita se não tem permissão */}
      <ProtectedButton 
        resource="tasks" 
        operation="DELETE"
        className="btn-danger"
        onClick={handleDelete}
      >
        Deletar
      </ProtectedButton>
    </div>
  );
}
```

### 5. FieldGuard
Controla campos em formulários:

```tsx
import { FieldGuard, ProtectedFieldLabel, ConditionalField } from '@/components/auth';

function TaskForm() {
  return (
    <form>
      {/* Campo que pode ser oculto, readonly ou editável */}
      <FieldGuard resource="tasks" field="amount">
        <ProtectedFieldLabel resource="tasks" field="amount" label="Valor" required />
        <input name="amount" type="number" />
      </FieldGuard>

      {/* Renderização condicional baseada na permissão */}
      <ConditionalField 
        resource="tasks" 
        field="secretNotes"
        whenReadOnly={<div>Notas: {data.secretNotes}</div>}
        whenHidden={null}
      >
        <textarea name="secretNotes" />
      </ConditionalField>
    </form>
  );
}
```

## 🪝 Hooks Especializados

### useScreenPermissions
```tsx
import { useScreenPermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const screen = useScreenPermissions();
  
  if (!screen.canAccessBilling()) {
    return <AccessDenied />;
  }
  
  return (
    <div>
      {screen.canAccessReports() && <ReportsSection />}
      {screen.canAccessSettings() && <SettingsButton />}
    </div>
  );
}
```

### useResourcePermissions
```tsx
import { useResourcePermissions } from '@/hooks/usePermissions';

function TaskList() {
  const resource = useResourcePermissions();
  
  return (
    <div>
      {resource.canCreateTask() && <NewTaskButton />}
      {resource.canUpdateTask() && <EditButton />}
      {resource.canDeleteTask() && <DeleteButton />}
    </div>
  );
}
```

### useFieldPermissions
```tsx
import { useFieldPermissions } from '@/hooks/usePermissions';

function TaskForm() {
  const field = useFieldPermissions();
  
  const getFieldProps = (fieldName: string) => ({
    hidden: field.isFieldHidden('tasks', fieldName),
    readOnly: field.isFieldReadOnly('tasks', fieldName),
    disabled: !field.canEditField('tasks', fieldName)
  });
  
  return (
    <form>
      <input {...getFieldProps('title')} name="title" />
      <input {...getFieldProps('amount')} name="amount" />
    </form>
  );
}
```

### useProfilePermissions
```tsx
import { useProfilePermissions } from '@/hooks/usePermissions';

function Header() {
  const profile = useProfilePermissions();
  
  return (
    <header>
      <h1>DevQuote</h1>
      {profile.isAdmin() && <AdminMenu />}
      {profile.hasManagementAccess() && <ManagementTools />}
      <UserRole role={profile.isAdmin() ? 'Admin' : 'User'} />
    </header>
  );
}
```

## 🎯 Exemplos Práticos

### Página com Múltiplas Proteções
```tsx
import React from 'react';
import { ScreenGuard, ResourceGuard, ProtectedButton } from '@/components/auth';
import { useResourcePermissions } from '@/hooks/usePermissions';

function TaskManagement() {
  const resource = useResourcePermissions();
  
  return (
    <ScreenGuard requiredScreen="tasks">
      <div className="page">
        <header className="flex justify-between">
          <h1>Gerenciamento de Tarefas</h1>
          
          <ResourceGuard resource="tasks" operation="CREATE">
            <ProtectedButton 
              resource="tasks" 
              operation="CREATE"
              className="btn-primary"
            >
              Nova Tarefa
            </ProtectedButton>
          </ResourceGuard>
        </header>

        <div className="content">
          <ResourceGuard resource="tasks" operation="READ">
            <TaskList />
          </ResourceGuard>
          
          {resource.hasAnyTaskPermission() ? (
            <TaskActions />
          ) : (
            <div>Sem permissões para gerenciar tarefas</div>
          )}
        </div>
      </div>
    </ScreenGuard>
  );
}
```

### Formulário com Campos Protegidos
```tsx
import { FieldGuard, ProtectedFieldLabel, useFieldPermissions } from '@/components/auth';

function TaskForm({ data, onChange }) {
  const { getInputProps } = useFieldPermissions();
  
  return (
    <form>
      <FieldGuard resource="tasks" field="title">
        <ProtectedFieldLabel resource="tasks" field="title" label="Título" required />
        <input 
          {...getInputProps('tasks', 'title', { 
            value: data.title, 
            onChange: e => onChange('title', e.target.value) 
          })}
        />
      </FieldGuard>

      <FieldGuard resource="tasks" field="amount">
        <ProtectedFieldLabel resource="tasks" field="amount" label="Valor" />
        <input 
          {...getInputProps('tasks', 'amount', { 
            type: 'number',
            value: data.amount, 
            onChange: e => onChange('amount', e.target.value) 
          })}
        />
      </FieldGuard>

      <FieldGuard resource="tasks" field="internalNotes">
        <ProtectedFieldLabel resource="tasks" field="internalNotes" label="Notas Internas" />
        <textarea 
          {...getInputProps('tasks', 'internalNotes', { 
            value: data.internalNotes, 
            onChange: e => onChange('internalNotes', e.target.value) 
          })}
        />
      </FieldGuard>
    </form>
  );
}
```

### Sidebar Dinâmica
```tsx
// Já implementado em src/components/layout/Sidebar.tsx
// Filtra automaticamente os menus baseado nas permissões de tela do usuário
```

## 🔒 Boas Práticas

### 1. **Sempre Validar no Backend**
```tsx
// ❌ Errado - apenas frontend
if (user.canDelete) {
  await api.delete(`/tasks/${id}`);
}

// ✅ Correto - backend valida também
if (resource.canDeleteTask()) {
  try {
    await api.delete(`/tasks/${id}`);
    toast.success('Tarefa deletada!');
  } catch (error) {
    toast.error('Sem permissão para deletar');
  }
}
```

### 2. **Usar Fallbacks Apropriados**
```tsx
// ✅ Bom - mostra mensagem clara
<ScreenGuard 
  requiredScreen="billing"
  fallback={<AccessDenied message="Acesso ao faturamento restrito" />}
>
  <BillingData />
</ScreenGuard>
```

### 3. **Combinar Múltiplas Verificações**
```tsx
// ✅ Proteção em camadas
<ScreenGuard requiredScreen="tasks">
  <ResourceGuard resource="tasks" operation="READ">
    <TaskList />
  </ResourceGuard>
</ScreenGuard>
```

### 4. **Usar Loading States**
```tsx
function SecurePage() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <PageContent />;
}
```

## ⚠️ Importante

1. **Segurança não é apenas frontend** - Todas as validações devem ser replicadas no backend
2. **Performance** - Use `useMemo` para verificações custosas de permissão
3. **UX** - Sempre forneça feedback claro quando o acesso é negado
4. **Debugging** - Use as props `showFallback={false}` para ocultar elementos em vez de mostrar mensagens

## 🔄 Fluxo de Atualização de Permissões

As permissões são automaticamente:
- **Carregadas** no login
- **Armazenadas** no localStorage
- **Validadas** a cada verificação de token
- **Atualizadas** via `refreshPermissions()` quando necessário

```tsx
const { refreshPermissions } = useAuth();

// Atualizar permissões manualmente (ex: após mudança de perfil)
await refreshPermissions();
```

Este sistema garante segurança robusta e experiência de usuário consistente em toda a aplicação.