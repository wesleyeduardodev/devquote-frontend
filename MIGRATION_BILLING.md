# 📋 Guia de Migração: TaskBillingMonth → BillingPeriod

Este documento orienta sobre as mudanças necessárias no frontend para refletir a refatoração do backend.

## 🔄 Alterações Principais

### Backend Changes
- **Entidade**: `TaskBillingMonth` → `BillingPeriod`
- **Junction**: `TaskBillingMonthTask` → `BillingPeriodTask` 
- **APIs**: `/api/task-billing-months` → `/api/billing-periods`
- **Funcionalidade**: Removida dependência de Quote, agora trabalha diretamente com Tasks

### Frontend Changes
- **Tipos**: `BillingMonth` → `BillingPeriod`
- **Hooks**: `useBillingMonths` → `useBillingPeriods`  
- **Serviços**: `billingMonthService` → `billingPeriodService`
- **Componentes**: `BillingMonthForm` → `BillingPeriodForm`
- **Páginas**: `BillingMonthManagement` → `BillingPeriodManagement`

## 📂 Arquivos Criados/Atualizados

### ✅ Novos Arquivos
- `src/types/billing.types.ts` - Novos tipos TypeScript
- `src/hooks/useBillingPeriods.ts` - Hook atualizado
- `src/services/billingPeriodService.ts` - Serviço atualizado
- `src/components/forms/BillingPeriodForm.tsx` - Formulário atualizado
- `src/pages/billing/BillingPeriodManagement.tsx` - Página atualizada

### ⚠️ Arquivos Deprecated (manter temporariamente)
- `src/hooks/useBillingMonths.ts` - Marcado como deprecated
- `src/services/billingMonthService.ts` - Marcado como deprecated  
- `src/components/forms/BillingMonthForm.tsx` - Marcado como deprecated
- `src/pages/billing/BillingMonthManagement.tsx` - Será substituído

## 🔄 Mudanças de API

### Endpoints Antigos (Deprecated)
```typescript
// ❌ Removidos do backend
GET    /api/quote-billing-months
POST   /api/quote-billing-months
PUT    /api/quote-billing-months/:id
DELETE /api/quote-billing-months/:id

GET    /api/quote-billing-month-quotes  // Operações com Quote removidas
POST   /api/quote-billing-month-quotes
```

### Novos Endpoints
```typescript
// ✅ Novos endpoints
GET    /api/billing-periods
POST   /api/billing-periods
PUT    /api/billing-periods/:id
DELETE /api/billing-periods/:id
GET    /api/billing-periods/statistics
GET    /api/billing-periods/export/excel

// Para gerenciar tarefas
GET    /api/billing-period-tasks
POST   /api/billing-period-tasks
DELETE /api/billing-period-tasks/:id
POST   /api/billing-period-tasks/bulk-link
DELETE /api/billing-period-tasks/billing-period/:id/bulk-unlink
```

## 🚀 Como Migrar

### 1. Atualizar Imports
```typescript
// ❌ Antigo
import { useBillingMonths } from '@/hooks/useBillingMonths';
import billingMonthService from '@/services/billingMonthService';
import BillingMonthForm from '@/components/forms/BillingMonthForm';

// ✅ Novo
import { useBillingPeriods } from '@/hooks/useBillingPeriods';
import billingPeriodService from '@/services/billingPeriodService';
import BillingPeriodForm from '@/components/forms/BillingPeriodForm';
```

### 2. Atualizar Tipos
```typescript
// ❌ Antigo
interface BillingMonth {
  id: number;
  month: number;
  year: number;
  paymentDate?: string;
  status: string;
}

// ✅ Novo
import { BillingPeriod, BillingPeriodRequest } from '@/types/billing.types';
```

### 3. Atualizar Chamadas de API
```typescript
// ❌ Antigo - Operações com Quote (não existem mais)
await billingMonthService.linkQuoteToBilling(billingMonthId, quoteId);
await billingMonthService.bulkLinkQuotes(requests);

// ✅ Novo - Operações com Task
await billingPeriodService.createTaskLink({ billingPeriodId, taskId });
await billingPeriodService.bulkLinkTasks(requests);
```

### 4. Atualizar Componentes
```typescript
// ❌ Antigo
const { billingMonths, createBillingMonth } = useBillingMonths();

// ✅ Novo  
const { billingPeriods, createBillingPeriod } = useBillingPeriods();
```

## ⚠️ Breaking Changes

### 1. Operações de Quote Removidas
As seguintes operações não existem mais:
- `linkQuoteToBilling()` 
- `unlinkQuoteFromBilling()`
- `bulkLinkQuotes()`
- `bulkUnlinkQuotes()`

**Solução**: Use as operações equivalentes com Task:
- `linkTaskToBilling()`
- `unlinkTaskFromBilling()`
- `bulkLinkTasks()`
- `bulkUnlinkTasks()`

### 2. Estrutura de Dados
```typescript
// ❌ Antigo
interface QuoteLink {
  id: number;
  quoteBillingMonthId: number;
  quoteId: number;
}

// ✅ Novo
interface BillingPeriodTask {
  id: number;
  billingPeriodId: number;
  taskId: number;
}
```

### 3. Validação de Tarefas Únicas
Nova validação impede que uma tarefa seja adicionada a múltiplos períodos:

```typescript
// Novo comportamento - erro será lançado
try {
  await billingPeriodService.createTaskLink({ billingPeriodId: 1, taskId: 10 });
  // Se a tarefa já estiver em outro período, receberá erro:
  // "A tarefa ID 10 já está incluída no faturamento do período 12/2024"
} catch (error) {
  // Tratar erro de tarefa duplicada
  if (error.message.includes('já está incluída')) {
    toast.error(error.message);
  }
}
```

## 📋 Checklist de Migração

### Para cada arquivo que usa billing:

- [ ] Atualizar imports para novos hooks/serviços
- [ ] Substituir `BillingMonth` por `BillingPeriod` nos tipos
- [ ] Atualizar calls de API para novos endpoints
- [ ] Remover operações de Quote se existirem
- [ ] Adicionar tratamento para erro de tarefa duplicada
- [ ] Testar funcionalidades de CRUD
- [ ] Testar operações de link/unlink de tasks
- [ ] Verificar se exportação Excel funciona

### Arquivos que precisam ser atualizados:
- [ ] `src/pages/billing/BillingMonthManagement.tsx` → Substituir por `BillingPeriodManagement.tsx`
- [ ] Qualquer referência em rotas (`App.tsx`, `routeConfig.ts`)
- [ ] Qualquer componente que importe `useBillingMonths`
- [ ] Qualquer página que use `billingMonthService`

## 🧪 Testes

Após migração, testar:

1. **CRUD de Períodos**
   - [ ] Criar novo período
   - [ ] Listar períodos
   - [ ] Editar período
   - [ ] Excluir período
   - [ ] Exclusão em lote

2. **Gestão de Tarefas**
   - [ ] Vincular tarefas ao período
   - [ ] Desvincular tarefas do período
   - [ ] Operações em lote
   - [ ] Validação de tarefa única (deve dar erro ao tentar duplicar)

3. **Funcionalidades Extras**
   - [ ] Exportação Excel
   - [ ] Estatísticas por status
   - [ ] Filtros e busca
   - [ ] Paginação

## 🚦 Status da Migração

- ✅ Tipos TypeScript criados
- ✅ Hook `useBillingPeriods` criado
- ✅ Serviço `billingPeriodService` criado
- ✅ Componente `BillingPeriodForm` criado
- ✅ Página `BillingPeriodManagement` criada
- ⏳ Arquivos antigos marcados como deprecated
- ⏳ Rotas precisam ser atualizadas
- ⏳ Testes precisam ser executados

## 📞 Suporte

Se encontrar problemas durante a migração:
1. Verifique se todas as importações foram atualizadas
2. Confirme se o backend está rodando com as novas APIs
3. Teste as validações de tarefa única
4. Verifique logs do console para erros de API