# DevQuote Frontend

Interface web moderna e responsiva para o sistema empresarial DevQuote de gestão de orçamentos, projetos, tarefas e entregas.  
Desenvolvido com **React 18**, **TypeScript 5.5** e **Vite 5**, oferecendo uma experiência rápida, type-safe e otimizada.

## 🚀 Tecnologias

### Core
- **React 18.2** - Biblioteca UI
- **TypeScript 5.5** - Type safety
- **Vite 5.0** - Build tool ultrarrápida

### Roteamento e Estado
- **React Router DOM 6.30** - Navegação SPA
- **Custom Hooks** - Gerenciamento de estado local
- **Context API** - Estado global (autenticação)

### UI/UX
- **Tailwind CSS 3.4** - Estilização utility-first
- **Lucide React** - Ícones modernos
- **React Hot Toast** - Notificações elegantes
- **Clsx** - Gestão condicional de classes

### Formulários e Validação
- **React Hook Form 7.62** - Gestão de formulários performática
- **Yup 1.7** - Schema validation
- **@hookform/resolvers** - Integração RHF + Yup

### Comunicação HTTP
- **Axios 1.11** - Cliente HTTP com interceptors
- **API REST** - Integração com backend Spring Boot

## 📦 Arquitetura do Projeto

```
src/
├── components/           # Componentes reutilizáveis
│   ├── auth/            # Guards de autenticação e autorização
│   │   ├── FieldGuard   # Controle de acesso por campo
│   │   ├── ResourceGuard # Controle de acesso por recurso
│   │   └── ScreenGuard   # Controle de acesso por tela
│   ├── billing/         # Componentes de faturamento
│   ├── deliveries/      # Modais e detalhes de entregas
│   ├── forms/           # Formulários compartilhados
│   │   ├── BillingMonthForm
│   │   ├── DeliveryForm
│   │   ├── ProjectForm
│   │   ├── QuoteForm
│   │   ├── RequesterForm
│   │   ├── SubTaskForm
│   │   └── TaskForm
│   ├── layout/          # Estrutura da aplicação
│   │   ├── Header       # Cabeçalho com menu
│   │   ├── Sidebar      # Menu lateral
│   │   └── Layout       # Container principal
│   ├── tasks/           # Componentes de tarefas
│   └── ui/              # Componentes base
│       ├── Button
│       ├── Card
│       ├── DataTable    # Tabela com paginação
│       ├── Input
│       ├── LoadingSpinner
│       ├── Modal
│       ├── Select
│       └── TextArea
├── hooks/               # Custom React Hooks
│   ├── useApi          # Hook genérico para API
│   ├── useAuth         # Autenticação e contexto
│   ├── useBillingMonths
│   ├── useDashboard
│   ├── useDeliveries
│   ├── usePermissions
│   ├── useProjects
│   ├── useQuotes
│   ├── useRequesters
│   ├── useTasks
│   └── useUserManagement
├── pages/              # Páginas/Rotas da aplicação
│   ├── billing/        # Gestão de faturamento
│   ├── deliveries/     # CRUD de entregas
│   ├── profiles/       # Gestão de perfis e permissões
│   ├── projects/       # CRUD de projetos
│   ├── quotes/         # CRUD de orçamentos
│   ├── requesters/     # CRUD de solicitantes
│   ├── tasks/          # CRUD de tarefas
│   ├── Dashboard.tsx   # Página inicial com métricas
│   ├── Login.tsx       # Autenticação
│   ├── NotFound.tsx    # 404
│   └── UserSettings.tsx # Configurações do usuário
├── services/           # Camada de serviços/API
│   ├── api.ts          # Configuração do Axios
│   ├── authService.ts
│   ├── billingMonthService.ts
│   ├── deliveryService.ts
│   ├── projectService.ts
│   ├── quoteService.ts
│   ├── requesterService.ts
│   ├── taskService.ts
│   └── userManagementService.ts
├── types/              # TypeScript types/interfaces
│   ├── api.types.ts    # Tipos da API
│   ├── auth.ts         # Tipos de autenticação
│   ├── common.types.ts # Tipos compartilhados
│   ├── dashboard.ts
│   ├── delivery.types.ts
│   ├── form.types.ts
│   ├── profile.ts
│   ├── project.types.ts
│   ├── quote.types.ts
│   ├── requester.types.ts
│   ├── task.types.ts
│   └── user.ts
├── utils/              # Funções utilitárias
│   ├── constants.ts    # Constantes da aplicação
│   ├── formatters.ts   # Formatação de dados
│   ├── routeConfig.ts  # Configuração de rotas
│   └── validationSchemas.ts # Schemas Yup
├── App.tsx             # Componente raiz
├── main.tsx           # Entry point
└── index.css          # Estilos globais + Tailwind
```

## 🔧 Configuração do Ambiente

### Requisitos
- Node.js 18+ (LTS recomendado)
- npm 9+ ou yarn 1.22+

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# API Backend
VITE_API_URL=http://localhost:8080

# Configurações da Aplicação
VITE_APP_NAME=DevQuote
VITE_APP_ENV=development
VITE_APP_VERSION=0.0.1

# Features Flags (opcional)
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

### Configuração para Produção

```env
VITE_API_URL=https://api.devquote.com
VITE_APP_ENV=production
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false
```

## 💻 Desenvolvimento Local

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/devquote.git
cd devquote/devquote-frontend

# Instalar dependências
npm install

# Executar em modo desenvolvimento (porta 5173)
npm run dev

# Build para produção
npm run build

# Preview do build de produção
npm run preview

# Verificação de tipos TypeScript
npm run typecheck

# Linting do código
npm run lint

# Todos os checks antes de commit
npm run typecheck && npm run lint
```

## 🌐 Deploy

### Vercel (Recomendado)

1. **Conectar Repositório**
   ```bash
   vercel link
   ```

2. **Configurar Variáveis de Ambiente**
   ```bash
   vercel env add VITE_API_URL
   vercel env add VITE_APP_NAME
   vercel env add VITE_APP_ENV
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Netlify

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

## 🔒 Sistema de Segurança

### Autenticação
- **JWT Bearer Token** - Armazenado em localStorage
- **Refresh Token** - Renovação automática
- **Logout** - Limpeza de tokens e estado

### Autorização
- **ProtectedRoute** - Proteção de rotas privadas
- **ResourceGuard** - Controle de acesso a recursos
- **FieldGuard** - Controle de visibilidade de campos
- **ScreenGuard** - Controle de acesso a telas

### Exemplo de Uso dos Guards

```tsx
// Proteger rota
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Controlar acesso a recurso
<ResourceGuard resource="QUOTE" operation="CREATE">
  <Button>Criar Orçamento</Button>
</ResourceGuard>

// Controlar visibilidade de campo
<FieldGuard resource="QUOTE" field="value" operation="UPDATE">
  <Input name="value" />
</FieldGuard>
```

## 📊 Funcionalidades Implementadas

### Módulos de Negócio
- ✅ **Dashboard** - KPIs e métricas em tempo real
- ✅ **Orçamentos** - Criação, edição e acompanhamento
- ✅ **Projetos** - Gestão completa com timeline
- ✅ **Tarefas** - Kanban e lista com subtarefas
- ✅ **Entregas** - Controle de entregas agrupadas
- ✅ **Faturamento** - Gestão mensal de cobranças
- ✅ **Solicitantes** - CRM básico de clientes
- ✅ **Perfis** - Gestão de usuários e permissões

### Recursos Técnicos
- ✅ **Paginação** - DataTable com controles
- ✅ **Busca e Filtros** - Em todas as listagens
- ✅ **Ordenação** - Colunas clicáveis
- ✅ **Loading States** - Feedback visual
- ✅ **Error Handling** - Tratamento global
- ✅ **Toast Notifications** - Feedback de ações
- ✅ **Formulários Dinâmicos** - Validação em tempo real
- ✅ **Responsividade** - Mobile-first design
- ✅ **Dark Mode Ready** - Preparado para tema escuro

## 🎨 Padrões de Desenvolvimento

### Estrutura de Componentes
```tsx
// Componente funcional com TypeScript
interface ComponentProps {
  title: string;
  onAction: () => void;
}

export const Component: React.FC<ComponentProps> = ({ title, onAction }) => {
  // Hooks primeiro
  const { data, loading } = useCustomHook();
  
  // Handlers
  const handleClick = () => {
    onAction();
  };
  
  // Render
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="p-4">
      <h1>{title}</h1>
    </div>
  );
};
```

### Convenções
- **Componentes:** PascalCase
- **Hooks:** camelCase com prefixo `use`
- **Services:** camelCase com sufixo `Service`
- **Types:** PascalCase com sufixo apropriado
- **Utils:** camelCase descritivo

## 🧪 Scripts Disponíveis

```json
{
  "dev": "Inicia servidor de desenvolvimento na porta 5173",
  "build": "Cria build otimizado para produção",
  "preview": "Visualiza build de produção localmente",
  "lint": "Verifica padrões de código com ESLint",
  "typecheck": "Verifica tipos TypeScript sem emitir código"
}
```

## 📈 Performance

### Otimizações Implementadas
- **Code Splitting** - Lazy loading de rotas
- **Tree Shaking** - Remoção de código não utilizado
- **Minificação** - CSS e JS otimizados
- **Compression** - Gzip/Brotli no build
- **Cache Headers** - Configurados para assets estáticos

### Métricas Target
- **LCP:** < 2.5s
- **FID:** < 100ms
- **CLS:** < 0.1
- **Bundle Size:** < 500KB gzipped

## 🤝 Contribuindo

### Setup do Ambiente de Desenvolvimento

1. Fork e clone o repositório
2. Instale as dependências: `npm install`
3. Crie uma branch: `git checkout -b feature/NovaFuncionalidade`
4. Faça suas alterações e teste
5. Commit com mensagem descritiva: `git commit -m 'feat: adiciona nova funcionalidade'`
6. Push para sua branch: `git push origin feature/NovaFuncionalidade`
7. Abra um Pull Request

### Padrão de Commits
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação (não afeta lógica)
- `refactor:` Refatoração de código
- `test:` Adição ou correção de testes
- `chore:` Manutenção e configuração

### Checklist para PR
- [ ] Código testado localmente
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Lint passou (`npm run lint`)
- [ ] Build funcionando (`npm run build`)
- [ ] Documentação atualizada se necessário

## 📄 Licença

Este projeto é privado e proprietário. Todos os direitos reservados.

## 👥 Equipe

Desenvolvido com ❤️ para a comunidade de desenvolvedores freelancers.

---

**DevQuote Frontend** - Interface moderna para gestão empresarial eficiente.