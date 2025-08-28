# Deploy no Vercel

## Configuração das Variáveis de Ambiente

### Desenvolvimento Local
1. Copie o arquivo `.env.example` para `.env`
2. Configure a URL da API local:
   ```
   VITE_API_URL=http://localhost:8080/api
   ```

### Deploy no Vercel

#### Via Interface Web do Vercel:
1. Acesse seu projeto no dashboard do Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:
   - `VITE_API_URL`: URL da sua API em produção (ex: `https://devquote-backend-latest.onrender.com/api`)
   - `VITE_APP_NAME`: DevQuote
   - `VITE_APP_ENV`: production

#### Via Vercel CLI:
```bash
vercel env add VITE_API_URL production
# Digite: https://devquote-backend-latest.onrender.com/api

vercel env add VITE_APP_NAME production
# Digite: DevQuote

vercel env add VITE_APP_ENV production
# Digite: production
```

## Ambientes Diferentes

Você pode configurar variáveis diferentes para cada ambiente:

- **Development**: Variáveis locais no arquivo `.env`
- **Preview**: Branches de preview no Vercel
- **Production**: Branch principal (main/master)

## Verificando as Variáveis

No código, você pode verificar se as variáveis estão carregadas:

```typescript
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('Environment:', import.meta.env.VITE_APP_ENV);
```

## Importante

- **NUNCA** commite o arquivo `.env` com dados sensíveis
- Sempre use o prefixo `VITE_` para variáveis que precisam ser acessíveis no frontend
- Após alterar variáveis no Vercel, faça um redeploy para aplicar as mudanças