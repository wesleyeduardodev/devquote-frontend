# DevQuote Frontend

Interface web moderna para o sistema DevQuote de gestão de orçamentos, tarefas e entregas.  
Desenvolvido com **React 18**, **TypeScript** e **Vite**, oferecendo uma experiência rápida e responsiva.

## 🚀 Tecnologias

- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **React Router DOM** para navegação
- **React Hook Form** + **Yup** para formulários
- **Axios** para requisições HTTP
- **Tailwind CSS** para estilização
- **Lucide React** para ícones
- **React Hot Toast** para notificações

## 📦 Estrutura do Projeto

```
src/
├── components/       # Componentes reutilizáveis
│   ├── auth/        # Guards de autenticação
│   ├── billing/     # Componentes de faturamento
│   ├── deliveries/  # Componentes de entregas
│   ├── forms/       # Formulários compartilhados
│   ├── layout/      # Layout da aplicação
│   ├── tasks/       # Componentes de tarefas
│   └── ui/          # Componentes de UI básicos
├── hooks/           # Custom hooks
├── pages/           # Páginas da aplicação
│   ├── billing/     # Gestão de faturamento
│   ├── deliveries/  # Gestão de entregas
│   ├── profiles/    # Gestão de perfis
│   ├── projects/    # Gestão de projetos
│   ├── quotes/      # Gestão de orçamentos
│   ├── requesters/  # Gestão de solicitantes
│   └── tasks/       # Gestão de tarefas
├── services/        # Serviços de API
├── types/           # TypeScript types
└── utils/           # Utilitários
```

## 🔧 Configuração do Ambiente

### Requisitos
- Node.js 18+
- npm ou yarn

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:8080/api
VITE_APP_NAME=DevQuote
VITE_APP_ENV=development
```

Para produção, configure as variáveis no seu serviço de hospedagem (Vercel, Netlify, etc).

## 💻 Executando Localmente

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Verificar tipos
npm run typecheck

# Linter
npm run lint
```

## 🌐 Deploy

### Vercel

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente:
   - `VITE_API_URL`: URL da sua API de produção
   - `VITE_APP_NAME`: DevQuote
   - `VITE_APP_ENV`: production
3. Deploy automático a cada push

### Build Manual

```bash
# Gerar build de produção
npm run build

# Os arquivos estarão em ./dist
```

## 🔒 Autenticação e Segurança

O sistema implementa:
- Autenticação via JWT
- Guards de rota (ProtectedRoute)
- Guards de recurso (ResourceGuard, FieldGuard, ScreenGuard)
- Controle granular de permissões
- Refresh automático de token

## 📝 Funcionalidades Principais

- **Dashboard**: Visão geral com métricas e estatísticas
- **Projetos**: Criação e gestão de projetos
- **Tarefas**: Organização de tarefas e subtarefas
- **Orçamentos**: Geração e controle de orçamentos
- **Faturamento**: Gestão de cobranças mensais
- **Entregas**: Registro e acompanhamento de entregas
- **Perfis**: Gestão de usuários e permissões

## 🎨 Componentes UI

O projeto inclui componentes reutilizáveis:
- Button, Input, Select, TextArea
- Modal, Card
- DataTable com paginação
- LoadingSpinner
- Formulários padronizados

## 🧪 Scripts Disponíveis

```json
{
  "dev": "Servidor de desenvolvimento",
  "build": "Build de produção",
  "preview": "Preview do build",
  "lint": "Verificação de código",
  "typecheck": "Verificação de tipos"
}
```

## 📚 Documentação da API

A documentação completa da API está disponível em:
- Desenvolvimento: `http://localhost:8080/swagger-ui/index.html`
- Produção: Consulte a URL da sua API

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado e proprietário.