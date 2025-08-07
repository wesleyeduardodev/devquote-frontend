# Budget Control - Frontend

Sistema de controle de orçamento desenvolvido com React e Vite.

## 🚀 Tecnologias

- **React 18** - Biblioteca para interfaces de usuário
- **Vite** - Build tool e dev server
- **React Router DOM** - Navegação
- **React Hook Form** - Gerenciamento de formulários
- **Yup** - Validação de esquemas
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Framework CSS utilitário
- **Lucide React** - Ícones
- **React Hot Toast** - Notificações

## 📦 Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd budget-control-frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure a API:
   - Certifique-se de que a API está rodando na porta 8080
   - A URL base está configurada em `src/services/api.js`

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`

## 🏗️ Estrutura do Projeto

```
src/
udget-control-frontend/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Layout.jsx
│   │   └── forms/
│   │       ├── RequesterForm.jsx
│   │       ├── TaskForm.jsx
│   │       ├── SubTaskForm.jsx
│   │       └── FormField.jsx
│   ├── pages/
│   │   ├── requesters/
│   │   │   ├── RequesterList.jsx
│   │   │   ├── RequesterCreate.jsx
│   │   │   └── RequesterEdit.jsx
│   │   ├── tasks/
│   │   │   ├── TaskList.jsx
│   │   │   ├── TaskCreate.jsx
│   │   │   └── TaskEdit.jsx
│   │   ├── Dashboard.jsx
│   │   └── NotFound.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── requesterService.js
│   │   └── taskService.js
│   ├── hooks/
│   │   ├── useRequesters.js
│   │   ├── useTasks.js
│   │   └── useApi.js
│   ├── utils/
│   │   ├── validationSchemas.js
│   │   ├── constants.js
│   │   └── formatters.js
│   ├── styles/
│   │   └── globals.css
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .eslintrc.cjs
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.js
└── vite.config.js
```

## 🎯 Funcionalidades

### ✅ Implementadas
- **Dashboard** - Visão geral do sistema
- **Solicitantes** - CRUD completo
  - Listagem com cards responsivos
  - Criação de novos solicitantes
  - Edição de solicitantes existentes
  - Exclusão com confirmação
  - Validação de formulários
  - Feedback de ações (toasts)

### 🔄 Em Desenvolvimento
- **Orçamentos** - Funcionalidade planejada
- **Relatórios** - Funcionalidade planejada

## 🎨 Design System

O projeto utiliza um design system baseado em:
- **Cores primárias**: Tons de azul (primary-*)
- **Tipografia**: Inter (Google Fonts)
- **Espaçamento**: Sistema baseado em múltiplos de 4px
- **Componentes**: Reutilizáveis e consistentes
- **Responsividade**: Mobile-first approach

## 🔧 Scripts Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build de produção
npm run lint     # Verificar código com ESLint
```

## 🌐 API Integration

O frontend está configurado para se conectar com a API Spring Boot:
- **Base URL**: `http://localhost:8080/api`
- **Endpoint Solicitantes**: `/requesters`
- **Timeout**: 10 segundos
- **Interceptors**: Tratamento automático de erros

## 📱 Responsividade

O layout é totalmente responsivo com breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔒 Validação

Validação robusta implementada com Yup:
- **Nome**: Obrigatório, máximo 200 caracteres
- **Email**: Formato válido, máximo 200 caracteres
- **Telefone**: Formato internacional, máximo 20 caracteres

## 🎯 Próximos Passos

1. Implementar módulo de orçamentos
2. Adicionar sistema de autenticação
3. Implementar relatórios e dashboard avançado
4. Adicionar filtros e busca na listagem
5. Implementar paginação
6. Adicionar testes unitários e de integração
7. Implementar PWA (Progressive Web App)

## 🐛 Tratamento de Erros

O sistema possui tratamento robusto de erros:
- **Interceptors Axios**: Captura e trata erros de API
- **Validação de Formulários**: Feedback em tempo real
- **Notificações**: Toasts para sucesso e erro
- **Estados de Loading**: Feedback visual durante operações
- **Fallbacks**: Páginas de erro e estados vazios

## 🚀 Performance

Otimizações implementadas:
- **Lazy Loading**: Componentes carregados sob demanda
- **Memoização**: React.memo em componentes apropriados
- **Bundle Splitting**: Vite otimiza automaticamente
- **Imagens Otimizadas**: Formatos modernos
- **CSS Purging**: Tailwind remove CSS não utilizado

## 🤝 Contribuição

Para contribuir com o projeto:

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas:
- Abra uma issue no repositório
- Consulte a documentação da API
- Verifique se a API está rodando corretamente

---

*Desenvolvido com ❤️ usando React + Vite*