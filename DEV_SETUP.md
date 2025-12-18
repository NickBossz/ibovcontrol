# Guia de Configuração de Desenvolvimento Local

## Arquitetura

O projeto usa **Express.js dentro de uma Vercel Function** via `api/[...path].js`:
- Todas as rotas da API são capturadas por esta função
- O Express gerencia o roteamento interno
- Controllers organizados em `lib/controllers/`
- Rotas em `lib/routes/`

## Desenvolvimento Local - Vercel Dev (Recomendado)

### Pré-requisitos
```bash
npm install -g vercel
```

### Configuração
1. Copie `.env.local.example` para `.env.local`
2. Preencha as variáveis:
   - `MONGODB_URI` - Connection string do MongoDB Atlas
   - `MONGODB_DB` - Nome do banco (ibovcontrol)
   - `JWT_SECRET` - Chave secreta (32+ caracteres)

### Executar
```bash
vercel dev
```

Acesse: `http://localhost:3000`

## Rotas da API

Todas as rotas começam com `/api/`:

### Auth (Públicas)
- `POST /api/auth/login`
- `POST /api/auth/signup`
- `POST /api/auth/logout`
- `POST /api/auth/reset-password`

### Users (Autenticadas)
- `GET /api/users/me` - Dados do usuário atual
- `GET /api/users/role` - Role do usuário
- `GET /api/users/list` - Lista usuários (admin)
- `PUT /api/users/update-role` - Atualiza role (admin)

### Portfolio (Autenticadas)
- `GET /api/portfolio/assets`

### Support/Resistance (Autenticadas)
- `GET /api/support-resistance/list`

---

## Variáveis de Ambiente

### Produção (Vercel)
Configure no dashboard da Vercel em **Project Settings → Environment Variables**:
- `MONGODB_URI`
- `MONGODB_DB`
- `JWT_SECRET`

### Desenvolvimento Local
Use o arquivo `.env.local` (não commitado no git):
- Copie `.env.local.example` para `.env.local`
- Preencha com suas credenciais

---

## Troubleshooting

### Erro: `ERR_CONNECTION_REFUSED` ao fazer login
- **Causa:** Backend não está rodando
- **Solução:** Use `vercel dev` para rodar frontend e backend juntos

### Erro: `MongoServerError`
- **Causa:** `MONGODB_URI` não configurado ou inválido
- **Solução:** Verifique se `.env.local` existe e tem a URI correta

### Erro: `JWT_SECRET not defined`
- **Causa:** `JWT_SECRET` não configurado
- **Solução:** Adicione `JWT_SECRET` no `.env.local` com mínimo 32 caracteres
