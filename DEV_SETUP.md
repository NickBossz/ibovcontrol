# Guia de Configuração de Desenvolvimento Local

## Opção 1: Usando Vercel Dev (Recomendado)

O Vercel Dev roda o frontend e backend juntos, simulando o ambiente de produção.

### Instalação
```bash
npm install -g vercel
```

### Configuração
1. Copie `.env.local.example` para `.env.local`
2. Preencha as variáveis de ambiente no `.env.local`:
   - `MONGODB_URI` - Sua connection string do MongoDB Atlas
   - `MONGODB_DB` - Nome do banco (ibovcontrol)
   - `JWT_SECRET` - Chave secreta (mínimo 32 caracteres)

### Executar
```bash
vercel dev
```

O servidor estará disponível em `http://localhost:3000`

---

## Opção 2: Frontend e Backend Separados

### Backend (API)
Para rodar apenas o backend em desenvolvimento, você precisa de um servidor Node.js que execute as funções serverless localmente.

**Recomendação:** Use o Vercel Dev (Opção 1) em vez disso, pois é muito mais simples.

### Frontend
```bash
npm run dev
```

O frontend estará em `http://localhost:8080` e fará proxy das requisições `/api/*` para `http://localhost:3000` (configurado no `vite.config.ts`).

**Nota:** Você ainda precisará do backend rodando em `localhost:3000` para que as APIs funcionem.

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
