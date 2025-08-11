# Budget Control - Frontend

Sistema completo de controle de orçamento desenvolvido com React, TypeScript e Vite.

## 🚀 Tecnologias

- **React 18** - Biblioteca para interfaces de usuário
- **TypeScript** - Tipagem estática para JavaScript
- **Vite** - Build tool e dev server ultra-rápido
- **React Router DOM** - Navegação e roteamento
- **React Hook Form** - Gerenciamento de formulários performático
- **Yup** - Validação robusta de esquemas
- **Axios** - Cliente HTTP com interceptors
- **Tailwind CSS** - Framework CSS utilitário
- **Lucide React** - Conjunto moderno de ícones
- **React Hot Toast** - Sistema de notificações elegante

## 📦 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/wesleyeduardodev/devquote-frontend
cd budget-control-frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure a API:
    - Certifique-se de que a API está rodando na porta 8080
    - A URL base está configurada em `src/services/api.ts`

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`

## 🏗️ Estrutura do Projeto

```
budget-control-frontend/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── TextArea.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   ├── forms/
│   │   │   ├── BillingMonthForm.tsx
│   │   │   ├── DeliveryForm.tsx
│   │   │   ├── FormField.tsx
│   │   │   ├── ProjectForm.tsx
│   │   │   ├── RequesterForm.tsx
│   │   │   ├── SubTaskForm.tsx
│   │   │   └── TaskForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── pages/
│   │   ├── billing/
│   │   │   └── BillingMonthManagement.tsx
│   │   ├── deliveries/
│   │   │   ├── DeliveryCreate.tsx
│   │   │   ├── DeliveryEdit.tsx
│   │   │   └── DeliveryList.tsx
│   │   ├── projects/
│   │   │   ├── ProjectCreate.tsx
│   │   │   ├── ProjectEdit.tsx
│   │   │   └── ProjectList.tsx
│   │   ├── quotes/
│   │   │   ├── QuoteCreate.tsx
│   │   │   ├── QuoteEdit.tsx
│   │   │   └── QuoteList.tsx
│   │   ├── requesters/
│   │   │   ├── RequesterCreate.tsx
│   │   │   ├── RequesterEdit.tsx
│   │   │   └── RequesterList.tsx
│   │   ├── tasks/
│   │   │   ├── TaskCreate.tsx
│   │   │   ├── TaskEdit.tsx
│   │   │   └── TaskList.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   └── NotFound.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── billingMonthService.ts
│   │   ├── deliveryService.ts
│   │   ├── projectService.ts
│   │   ├── quoteService.ts
│   │   ├── requesterService.ts
│   │   └── taskService.ts
│   ├── hooks/
│   │   ├── useApi.ts
│   │   ├── useAuth.ts
│   │   ├── useBillingMonths.ts
│   │   ├── useDeliveries.ts
│   │   ├── useProjects.ts
│   │   ├── useQuotes.ts
│   │   ├── useRequesters.ts
│   │   └── useTasks.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── formatters.ts
│   │   └── validationSchemas.ts
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── global.d.ts
├── .eslintrc.cjs
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.js
├── tsconfig.json
└── vite.config.js
```

## 🎯 Funcionalidades Implementadas

### ✅ **Sistema Completo de Gestão:**

#### 📋 **Solicitantes (Requesters)**
- Listagem com cards responsivos e filtros
- Criação de novos solicitantes
- Edição e atualização de dados
- Exclusão com confirmação
- Validação robusta de formulários

#### 📊 **Projetos (Projects)**
- Gerenciamento completo de projetos
- Associação com solicitantes
- Controle de status e prazos
- Dashboard de projetos ativos

#### 💰 **Orçamentos (Quotes)**
- Criação e edição de orçamentos
- Cálculo automático de valores
- Múltiplos status (draft, enviado, aprovado, etc.)
- Histórico de versões

#### 📋 **Tarefas (Tasks)**
- Sistema de tarefas por projeto
- Controle de progresso
- Estimativas vs tempo real
- Priorização e categorização

#### 🚚 **Entregas (Deliveries)**
- Gerenciamento de entregas por projeto
- Upload de arquivos
- Controle de status de aprovação
- Feedback e comentários

#### 💳 **Faturamento Mensal (Billing)**
- Controle de períodos de faturamento
- Relatórios mensais
- Gestão de ciclos financeiros

#### 🔐 **Sistema de Autenticação**
- Login seguro
- Rotas protegidas
- Gerenciamento de sessão

### 🎨 **Design System Consistente**
- Componentes UI reutilizáveis
- Tema padronizado com Tailwind
- Responsividade em todos os dispositivos
- Feedback visual para todas as ações

## 🔧 Scripts Disponíveis

```bash
npm run dev        # Servidor de desenvolvimento com HMR
npm run build      # Build otimizada para produção
npm run preview    # Preview da build de produção
npm run lint       # Verificar código com ESLint
npm run typecheck  # Verificação de tipos TypeScript
```

## 🌐 Integração com API

### **Configuração da API:**
- **Base URL**: `http://localhost:8080/api`
- **Timeout**: 10 segundos
- **Interceptors**: Tratamento automático de erros e autenticação
- **Content-Type**: `application/json`

### **Endpoints Principais:**
- `/requesters` - Gestão de solicitantes
- `/projects` - Gestão de projetos
- `/quotes` - Gestão de orçamentos
- `/tasks` - Gestão de tarefas
- `/deliveries` - Gestão de entregas
- `/billing-months` - Gestão de faturamento mensal

## 📱 Responsividade

Layout totalmente responsivo com breakpoints otimizados:
- **Mobile**: < 768px (design mobile-first)
- **Tablet**: 768px - 1024px (layout adaptado)
- **Desktop**: > 1024px (experiência completa)

## 🔒 Validação e Segurança

### **Validação de Formulários:**
- **Yup Schema** para validação robusta
- **React Hook Form** para performance
- Feedback em tempo real
- Mensagens de erro personalizadas

### **Campos Validados:**
- **Nome**: Obrigatório, 2-200 caracteres
- **Email**: Formato válido, único
- **Telefone**: Formato internacional
- **Datas**: Validação de intervalos
- **Valores**: Números positivos, formatação monetária

### **Segurança:**
- Rotas protegidas com autenticação
- Sanitização de dados de entrada
- Validação client-side e server-side
- Tratamento seguro de tokens

## 🎨 Customização e Tema

### **Sistema de Cores:**
```css
/* Cores Primárias */
primary: #3b82f6   /* Azul principal */
secondary: #64748b /* Cinza secundário */
success: #22c55e   /* Verde para sucesso */
warning: #f59e0b   /* Amarelo para avisos */
error: #ef4444     /* Vermelho para erros */
```

### **Tipografia:**
- **Fonte Principal**: Inter (Google Fonts)
- **Hierarquia**: h1-h6 bem definida
- **Legibilidade**: Otimizada para todos os dispositivos

## 🚀 Performance e Otimizações

### **Estratégias Implementadas:**
- **Code Splitting**: Chunks automáticos por rota
- **Lazy Loading**: Componentes carregados sob demanda
- **React.memo**: Memoização de componentes puros
- **useCallback/useMemo**: Otimização de re-renders
- **Bundle Analysis**: Vite analisa automaticamente

### **Métricas de Performance:**
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Bundle Size**: Otimizado com tree-shaking

## 🐛 Tratamento de Erros

### **Sistema Robusto:**
- **Axios Interceptors**: Captura global de erros
- **Error Boundaries**: Captura de erros React
- **Fallback Components**: Estados de erro elegantes
- **Toast Notifications**: Feedback imediato ao usuário
- **Loading States**: Indicadores visuais de progresso

### **Tipos de Erro Tratados:**
- Erros de rede (timeout, conexão)
- Erros de validação (400, 422)
- Erros de autorização (401, 403)
- Erros do servidor (500+)
- Erros de JavaScript/React

## 🧪 Qualidade de Código

### **Ferramentas Utilizadas:**
- **TypeScript**: Tipagem estática completa
- **ESLint**: Análise de código e boas práticas
- **Prettier**: Formatação consistente
- **Husky**: Hooks de commit (planejado)

### **Padrões Seguidos:**
- **Component Composition**: Reutilização máxima
- **Custom Hooks**: Lógica compartilhada
- **Service Layer**: Separação de responsabilidades
- **Error Handling**: Tratamento consistente

## 🔄 Estado da Aplicação

### **Gerenciamento de Estado:**
- **React Hooks**: useState, useEffect, useContext
- **Custom Hooks**: Encapsulamento de lógica
- **Service Layer**: Cache e sincronização
- **Form State**: React Hook Form

### **Fluxo de Dados:**
- Unidirecional (top-down)
- Props drilling mínimo
- Context para estados globais
- Immutabilidade garantida

## 🎯 Roadmap e Próximos Passos

### **📅 Curto Prazo (1-2 meses):**
- [ ] Testes unitários e de integração
- [ ] Storybook para documentação de componentes
- [ ] PWA (Progressive Web App)
- [ ] Internacionalização (i18n)

### **📅 Médio Prazo (3-6 meses):**
- [ ] Dashboard avançado com gráficos
- [ ] Sistema de notificações em tempo real
- [ ] Relatórios PDF exportáveis
- [ ] Integração com calendário

### **📅 Longo Prazo (6+ meses):**
- [ ] Aplicativo mobile (React Native)
- [ ] Inteligência artificial para previsões
- [ ] Integração com sistemas ERP
- [ ] API GraphQL

## 🤝 Contribuição

### **Como Contribuir:**

1. **Fork** o repositório
2. **Clone** sua fork: `git clone <sua-fork>`
3. **Crie uma branch**: `git checkout -b feature/MinhaFeature`
4. **Implemente** sua funcionalidade
5. **Teste** thoroughly
6. **Commit**: `git commit -m 'feat: Adiciona nova funcionalidade'`
7. **Push**: `git push origin feature/MinhaFeature`
8. **Abra um Pull Request**

### **Padrões de Commit:**
```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: tarefas de build/config
```

## 📊 Monitoramento e Analytics

### **Métricas Coletadas:**
- Performance da aplicação
- Erros e exceções
- Uso de funcionalidades
- Jornada do usuário

### **Ferramentas:**
- Vite Bundle Analyzer
- React DevTools
- Browser DevTools
- Error tracking (planejado)

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte e Documentação

### **Para Desenvolvedores:**
- **Issues**: [GitHub Issues](link-para-issues)
- **Documentação**: README e comentários no código
- **API Docs**: Swagger/OpenAPI (backend)

### **Para Usuários:**
- **Manual do Usuário**: (em desenvolvimento)
- **Videos Tutoriais**: (planejado)
- **FAQ**: (em desenvolvimento)

## 🔗 Links Úteis

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com/)

---

**🚀 Desenvolvido com ❤️ pela equipe DevQuote**

*Sistema moderno de controle de orçamento para empresas que buscam eficiência e organização.*