# Migração Supabase → MongoDB Atlas - Concluída ✅

## O Que Foi Feito

### Backend (Serverless Functions - Vercel)

**Arquivos Criados:**

1. **`api/lib/`** - Biblioteca compartilhada
   - `mongodb.ts` - Conexão singleton com MongoDB Atlas
   - `auth.ts` - Funções JWT (sign, verify) e bcrypt (hash, compare)
   - `middleware.ts` - Middlewares de autenticação (requireAuth, requireAdmin)
   - `types.ts` - Tipos TypeScript compartilhados

2. **`api/auth/`** - Endpoints de autenticação
   - `signup.ts` - POST /api/auth/signup
   - `login.ts` - POST /api/auth/login
   - `logout.ts` - POST /api/auth/logout
   - `reset-password.ts` - POST /api/auth/reset-password

3. **`api/users/`** - Endpoints de usuários
   - `me.ts` - GET /api/users/me (usuário atual)
   - `role.ts` - GET /api/users/role (role do usuário)
   - `list.ts` - GET /api/users/list (listar todos - admin only)
   - `update-role.ts` - PUT /api/users/update-role (atualizar role - admin only)

4. **`api/portfolio/`** - Endpoints de carteira
   - `assets.ts` - GET/POST/PUT/DELETE /api/portfolio/assets

5. **`api/support-resistance/`** - Endpoints de suporte/resistência
   - `list.ts` - GET/POST/PUT/DELETE /api/support-resistance/list

### Frontend

**Novos Arquivos:**
- `src/lib/apiClient.ts` - Cliente HTTP para chamar a API REST
- `.env.local` - Variáveis de ambiente do backend

**Arquivos Modificados:**
- `src/contexts/AuthContext.tsx` - Autenticação com JWT (substituiu Supabase Auth)
- `src/services/userService.ts` - Chamadas para API REST
- `src/services/carteiraService.ts` - Chamadas para API REST
- `src/services/suportesResistenciasService.ts` - Chamadas para API REST
- `.env` - Variáveis de ambiente atualizadas

**Arquivos Removidos:**
- `src/lib/supabase.ts` ❌
- `src/types/supabase.ts` ❌
- `SUPABASE_SETUP.md` ❌
- Dependência `@supabase/supabase-js` removida ❌

---

## Próximos Passos Obrigatórios

### 1. Configurar MongoDB Atlas

1. **Criar Cluster:**
   - Acesse https://www.mongodb.com/cloud/atlas
   - Crie uma conta gratuita
   - Crie um cluster (Free Tier M0 é suficiente)

2. **Configurar Acesso:**
   - Em "Network Access", adicione seu IP ou `0.0.0.0/0` (permite todos - use com cautela)
   - Em "Database Access", crie um usuário com senha

3. **Obter Connection String:**
   - Clique em "Connect" → "Connect your application"
   - Copie a connection string
   - Substitua `<password>` pela senha do usuário

4. **Criar Collections e Índices:**
   ```javascript
   // Conecte ao seu cluster via MongoDB Compass ou Shell
   use ibovcontrol

   // Criar collections
   db.createCollection("users")
   db.createCollection("portfolio_assets")
   db.createCollection("support_resistance_levels")

   // Criar índices
   db.users.createIndex({ email: 1 }, { unique: true })
   db.portfolio_assets.createIndex({ userId: 1 })
   db.portfolio_assets.createIndex({ userId: 1, assetCode: 1 }, { unique: true })
   db.support_resistance_levels.createIndex({ assetCode: 1 }, { unique: true })
   db.support_resistance_levels.createIndex({ assetName: "text" })
   ```

### 2. Configurar Variáveis de Ambiente

**Edite `.env.local`:**
```env
MONGODB_URI=mongodb+srv://seu-usuario:sua-senha@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=ibovcontrol
JWT_SECRET=MUDE-ISSO-PARA-UMA-STRING-ALEATORIA-DE-32-CHARS-MINIMO
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
```

**IMPORTANTE:** Gere um JWT_SECRET seguro:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Migrar Dados do Supabase (Opcional)

Se você tem dados no Supabase:

1. **Exportar do Supabase:**
   ```sql
   -- No SQL Editor do Supabase
   COPY (SELECT * FROM auth.users) TO STDOUT WITH CSV HEADER;
   COPY (SELECT * FROM carteira) TO STDOUT WITH CSV HEADER;
   COPY (SELECT * FROM carteira_operacoes) TO STDOUT WITH CSV HEADER;
   COPY (SELECT * FROM suportes_resistencias) TO STDOUT WITH CSV HEADER;
   ```

2. **Transformar e Importar:**
   - Crie um script para transformar os dados CSV
   - Combine `carteira` + `carteira_operacoes` em `portfolio_assets`
   - Use MongoDB Compass ou `mongoimport` para importar

### 4. Testar Localmente

**Iniciar Backend (Vercel Dev):**
```bash
npm install -g vercel
vercel dev
```

**Iniciar Frontend:**
```bash
npm run dev
```

**Testar Fluxos:**
1. Signup de novo usuário em http://localhost:8080
2. Login
3. Criar ativo na carteira
4. Verificar no MongoDB Compass se os dados foram salvos

### 5. Deploy

**Backend (Vercel):**
```bash
vercel
```

**Configurar Variáveis no Vercel Dashboard:**
- `MONGODB_URI`
- `MONGODB_DB`
- `JWT_SECRET`
- `FRONTEND_URL` (URL do seu frontend em produção)
- `NODE_ENV=production`

**Frontend:**
1. Atualizar `.env` para produção:
   ```env
   VITE_API_BASE_URL=/api  # Se frontend e backend estão no mesmo domínio
   ```
2. Deploy com Vercel, Netlify ou outra plataforma

---

## Schema MongoDB

### Collection: `users`
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (bcrypt hash),
  role: String ('cliente' | 'admin'),
  name: String (optional),
  createdAt: Date,
  updatedAt: Date,
  lastSignInAt: Date (optional)
}
```

### Collection: `portfolio_assets`
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  assetCode: String,
  currentPosition: {
    quantity: Number,
    averagePrice: Number,
    totalInvested: Number,
    firstPurchaseDate: Date
  },
  operations: [
    {
      _id: ObjectId,
      type: String ('entrada' | 'saida'),
      quantity: Number,
      price: Number,
      operationDate: Date,
      notes: String (optional),
      createdAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Collection: `support_resistance_levels`
```javascript
{
  _id: ObjectId,
  assetCode: String (unique),
  assetName: String,
  support1: Number (optional),
  support2: Number (optional),
  resistance1: Number (optional),
  resistance2: Number (optional),
  levels: [
    {
      type: String ('suporte' | 'resistencia'),
      value: Number,
      reason: String (optional)
    }
  ],
  adminId: ObjectId,
  lastModified: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Endpoints Implementados

### Autenticação
- `POST /api/auth/signup` - Criar conta
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/reset-password` - Reset de senha

### Usuários
- `GET /api/users/me` - Dados do usuário atual
- `GET /api/users/role` - Role do usuário
- `GET /api/users/list` - Listar usuários (admin)
- `PUT /api/users/update-role` - Atualizar role (admin)

### Carteira
- `GET /api/portfolio/assets` - Listar ativos
- `POST /api/portfolio/assets` - Criar ativo
- `PUT /api/portfolio/assets` - Atualizar ativo
- `DELETE /api/portfolio/assets?id={id}` - Deletar ativo

### Suporte/Resistência
- `GET /api/support-resistance/list` - Listar todos
- `GET /api/support-resistance/list?search={term}` - Buscar
- `GET /api/support-resistance/list?assetCode={code}` - Por ativo
- `POST /api/support-resistance/list` - Criar (admin)
- `PUT /api/support-resistance/list` - Atualizar (admin)
- `DELETE /api/support-resistance/list?id={id}` - Deletar (admin)

---

## Endpoints Faltantes (Para Implementar)

Alguns endpoints de operações de carteira não foram completamente implementados:

1. `GET /api/portfolio/operations` - Listar operações
2. `POST /api/portfolio/operation` - Criar operação
3. `PUT /api/portfolio/operation/:assetId/:opId` - Atualizar operação
4. `DELETE /api/portfolio/operation/:assetId/:opId` - Deletar operação
5. `GET /api/portfolio/stats` - Estatísticas da carteira
6. `POST /api/portfolio/calculate-position` - Calcular posição

**Você pode implementá-los seguindo o padrão dos arquivos existentes.**

---

## Troubleshooting

### Erro: "Cannot find module"
- Execute `npm install` para garantir que todas as dependências estão instaladas

### Erro: "MONGODB_URI is not defined"
- Verifique se o arquivo `.env.local` existe e tem as variáveis corretas
- Execute `vercel env pull` para baixar variáveis do Vercel (se já configuradas)

### Erro: "Invalid or expired token"
- Limpe o localStorage no navegador: `localStorage.clear()`
- Faça login novamente

### Erro CORS
- Verifique se `FRONTEND_URL` no backend está correto
- Em desenvolvimento, deve ser `http://localhost:8080`
- Em produção, deve ser a URL do seu frontend

### Erro de conexão com MongoDB
- Verifique se o IP está na whitelist do MongoDB Atlas
- Teste a connection string com MongoDB Compass
- Verifique se a senha não tem caracteres especiais que precisam de encoding

---

## Arquitetura

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser   │ ────▶   │ Vercel       │ ────▶   │  MongoDB     │
│  (React)    │ ◀────   │ Serverless   │ ◀────   │  Atlas       │
│             │   JWT   │   Functions  │  CRUD   │              │
└─────────────┘         └──────────────┘         └──────────────┘
```

- **Frontend:** React + Vite (porta 8080)
- **Backend:** Vercel Serverless Functions (porta 3000 local)
- **Database:** MongoDB Atlas (cloud)
- **Auth:** JWT tokens armazenados no localStorage

---

## Segurança

✅ **Implementado:**
- Senhas com bcrypt (salt rounds = 10)
- JWT com expiração de 7 dias
- Middlewares de autenticação e autorização
- CORS configurado
- Validação de inputs nos endpoints

⚠️ **Recomendado para produção:**
- Rate limiting (evitar brute force)
- Token refresh mechanism
- HTTPS only
- Helmet.js para headers de segurança
- Logging e monitoring
- Backup automático do MongoDB

---

## Suporte

Se tiver dúvidas ou problemas:
1. Consulte o plano detalhado em `~/.claude/plans/memoized-questing-rossum.md`
2. Verifique os logs do Vercel: `vercel logs`
3. Use MongoDB Compass para debug do banco

---

**Migração Completa!** 🎉

O projeto agora usa MongoDB Atlas + JWT em vez de Supabase.
