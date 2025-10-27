# DevQuote Frontend

Interface moderna para gestão de tarefas e entregas para desenvolvedores freelancers.

---

## 🚀 Stack

### Core
- React 18 + TypeScript 5.5
- Vite 5 (Build tool)
- React Router DOM 6

### UI/UX
- Tailwind CSS 3
- Lucide React (ícones)
- React Hot Toast (notificações)

### Formulários
- React Hook Form 7
- Yup (validação)

### HTTP
- Axios 1.11
- JWT com refresh token automático

---

## 📦 Arquitetura

```
src/
├── components/           # Componentes reutilizáveis
│   ├── auth/            # Guards (Field, Resource, Screen)
│   ├── forms/           # Formulários compartilhados
│   ├── layout/          # Header, Sidebar, Layout
│   └── ui/              # Button, Card, DataTable, Modal, etc
├── hooks/               # Custom React Hooks
├── pages/               # Rotas da aplicação
├── services/            # Camada de API (Axios)
├── types/               # TypeScript types/interfaces
└── utils/               # Funções utilitárias
```

---

## 🔧 Quick Start

### Requisitos
- Node.js 18+
- npm 9+

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar (porta 5173)
npm run dev

# Build produção
npm run build

# Preview build
npm run preview

# Type check
npm run typecheck

# Lint
npm run lint
```

---

## 📚 Documentação API

Após iniciar, acesse:
- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:8080/api`
- **Swagger:** `http://localhost:8080/swagger-ui/index.html`

---

## 🔒 Segurança

### Autenticação
- JWT Bearer Token
- Refresh Token automático
- Logout com limpeza de estado

### Autorização
- **ProtectedRoute** - Proteção de rotas
- **ResourceGuard** - Controle de recursos
- **FieldGuard** - Controle de campos
- **ScreenGuard** - Controle de telas

### Exemplo de Guards

```tsx
// Proteger rota
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Controlar acesso a recurso
<ResourceGuard resource="TASKS" operation="CREATE">
  <Button>Criar Tarefa</Button>
</ResourceGuard>

// Controlar visibilidade de campo
<FieldGuard resource="BILLING" field="value" operation="UPDATE">
  <Input name="value" />
</FieldGuard>
```

---

## 📊 Funcionalidades

### Módulos
- Dashboard com métricas
- Gestão de projetos
- Tarefas e subtarefas
- Sistema de entregas
- Faturamento mensal
- Gerenciamento de solicitantes
- Perfis e permissões (RBAC)

### Recursos Técnicos
- Paginação com debounce
- Busca e filtros
- Ordenação de colunas
- Loading states
- Error handling global
- Toast notifications
- Validação de formulários
- Responsividade mobile-first

---

## 🐳 Docker

```bash
# Build
docker build -t devquote-frontend .

# Run
docker run -p 80:80 devquote-frontend
```

---

## 🎨 Design System

### Identidade Visual
- **Logo:** Raio (⚡) com gradiente azul-roxo
- **Cores Principais:**
  - Azul: `#3b82f6` (blue-600)
  - Roxo: `#8b5cf6` (purple-600)
  - Verde: `#10b981` (emerald-500)
- **Gradientes:** `from-blue-600 to-purple-700`

### Responsividade
- **Breakpoints:** `sm:` (640px+), `md:` (768px+), `lg:` (1024px+)
- **Modais Mobile:** Bottom sheet
- **Modais Desktop:** Centralizado
- **Design:** Mobile-first

---

## 🤝 Contribuindo

### Padrão de Commits
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes

---

## 📄 Licença

Projeto privado e proprietário. Todos os direitos reservados.
