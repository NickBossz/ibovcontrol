# Coleções do MongoDB - IBOVControl

Este documento descreve a estrutura das coleções usadas no projeto.

## 📦 Coleções

### 1. `users`

Armazena informações dos usuários do sistema.

```json
{
  "_id": ObjectId,
  "email": "usuario@example.com",
  "password": "hash_bcrypt",
  "role": "cliente" | "admin",
  "name": "Nome do Usuário" (opcional),
  "createdAt": ISODate,
  "updatedAt": ISODate,
  "lastSignInAt": ISODate (opcional)
}
```

**Índices:**
- `email` (unique)

---

### 2. `portfolio_assets`

Armazena os ativos da carteira de cada usuário.

```json
{
  "_id": ObjectId,
  "userId": ObjectId (ref: users),
  "assetCode": "PETR4",
  "currentPosition": {
    "quantity": 100,
    "averagePrice": 28.50,
    "totalInvested": 2850.00,
    "firstPurchaseDate": ISODate
  },
  "operations": [
    {
      "_id": ObjectId,
      "type": "entrada" | "saida",
      "quantity": 50,
      "price": 28.00,
      "operationDate": ISODate,
      "notes": "Compra inicial" (opcional),
      "createdAt": ISODate
    }
  ],
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

**Índices:**
- `userId`
- `userId` + `assetCode` (compound)

**Notas:**
- `operations` é um array embarcado que armazena todas as operações (entradas/saídas)
- `currentPosition` é calculado automaticamente ao adicionar/remover operações
- Quando uma operação é adicionada, o sistema recalcula:
  - Quantidade total (entradas - saídas)
  - Preço médio (total investido / quantidade)
  - Total investido (soma de todas as entradas)

---

### 3. `support_resistance_levels`

Armazena níveis de suporte e resistência dos ativos (gerenciado por admins).

```json
{
  "_id": ObjectId,
  "assetCode": "PETR4",
  "assetName": "Petrobras PN",
  "support1": 27.50 (opcional),
  "support2": 26.00 (opcional),
  "resistance1": 30.00 (opcional),
  "resistance2": 32.00 (opcional),
  "levels": [
    {
      "type": "suporte" | "resistencia",
      "value": 28.50,
      "reason": "Fundo histórico de 2023" (opcional)
    }
  ],
  "adminId": ObjectId (ref: users),
  "lastModified": ISODate,
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

**Índices:**
- `assetCode` (unique)

---

## 🔧 Como Criar as Coleções

As coleções são criadas automaticamente pelo MongoDB quando você insere o primeiro documento. Porém, para garantir os índices, execute no MongoDB Shell:

```javascript
// Conectar ao banco
use ibovcontrol

// Criar índices para users
db.users.createIndex({ email: 1 }, { unique: true })

// Criar índices para portfolio_assets
db.portfolio_assets.createIndex({ userId: 1 })
db.portfolio_assets.createIndex({ userId: 1, assetCode: 1 })

// Criar índice para support_resistance_levels
db.support_resistance_levels.createIndex({ assetCode: 1 }, { unique: true })
```

---

## 📝 Notas Importantes

1. **Operações são embarcadas**: As operações ficam dentro do documento de cada ativo, não em uma coleção separada
2. **Posição é calculada**: Ao adicionar/remover operações, a posição atual é recalculada automaticamente
3. **Roles**: O sistema suporta dois roles: `cliente` (padrão) e `admin`
4. **Datas**: Todas as datas são armazenadas como ISODate do MongoDB
5. **ObjectId**: IDs são gerados automaticamente pelo MongoDB

---

## 🚀 Rotas da API

### Portfolio Assets
- `GET /api/portfolio/assets` - Listar ativos
- `POST /api/portfolio/assets` - Adicionar ativo
- `PUT /api/portfolio/assets` - Atualizar ativo
- `DELETE /api/portfolio/assets?id=<id>` - Remover ativo

### Portfolio Operations
- `GET /api/portfolio/operations?assetId=<id>` - Listar operações de um ativo
- `POST /api/portfolio/operations` - Adicionar operação (recalcula posição automaticamente)
- `DELETE /api/portfolio/operations?assetId=<id>&operationId=<id>` - Remover operação

### Support/Resistance
- `GET /api/support-resistance/list` - Listar níveis
- `POST /api/support-resistance/list` - Criar nível (admin)
- `PUT /api/support-resistance/list` - Atualizar nível (admin)
- `DELETE /api/support-resistance/list?id=<id>` - Remover nível (admin)

### Users
- `GET /api/users/me` - Dados do usuário logado
- `GET /api/users/role` - Role do usuário
- `GET /api/users/list` - Listar usuários (admin)
- `PUT /api/users/update-role` - Atualizar role (admin)

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/signup` - Cadastro
- `POST /api/auth/logout` - Logout
- `POST /api/auth/reset-password` - Resetar senha
