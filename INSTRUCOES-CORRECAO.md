# 🔧 Instruções para Corrigir Erro de Função Duplicada

## ❌ Problema Identificado
```
ERROR: 42725: function public.is_admin() is not unique
HINT: Could not choose a best candidate function. You might need to add explicit type casts.
```

Este erro ocorre porque existem múltiplas funções `is_admin()` com assinaturas diferentes no banco de dados.

## 🛠️ Solução Passo a Passo

### Passo 1: Limpar Funções Duplicadas
Execute o script de limpeza no SQL Editor do Supabase:

```sql
-- Execute o arquivo: cleanup-functions.sql
```

Este script remove todas as funções duplicadas e conflitantes.

### Passo 2: Executar Script Principal
Após a limpeza, execute o script principal:

```sql
-- Execute o arquivo: supabase-setup.sql
```

### Passo 3: Configurar Usuário Admin
Configure um usuário como administrador:

```sql
UPDATE auth.users 
SET user_metadata = jsonb_set(
  COALESCE(user_metadata, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'seu-email@exemplo.com';
```

### Passo 4: Testar as Funções
Execute o script de teste para verificar se tudo está funcionando:

```sql
-- Execute o arquivo: test-functions.sql
```

## 📋 Verificações Importantes

### 1. Verificar se as funções foram criadas corretamente:
```sql
SELECT routine_name, routine_type, security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'is_admin', 
  'get_user_role', 
  'update_user_role', 
  'update_user_role_simple',
  'list_users'
);
```

### 2. Verificar se o usuário tem cargo admin:
```sql
SELECT 
  id,
  email,
  user_metadata->>'role' as role
FROM auth.users 
WHERE id = auth.uid();
```

### 3. Testar função is_admin():
```sql
SELECT public.is_admin();
```

## 🚨 Possíveis Problemas e Soluções

### Problema 1: Função ainda não existe após limpeza
**Solução**: Execute novamente o `supabase-setup.sql`

### Problema 2: Usuário não tem permissão
**Solução**: Verifique se o usuário tem cargo 'admin' definido

### Problema 3: Erro de permissão nas funções
**Solução**: Execute as permissões manualmente:
```sql
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_role_simple(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_users() TO authenticated;
```

## 🔍 Logs para Debug

### Verificar logs do Supabase:
1. Vá para o Dashboard do Supabase
2. Navegue para **Logs** > **Database Logs**
3. Procure por erros relacionados às funções

### Verificar logs do frontend:
1. Abra o Console do navegador (F12)
2. Procure por mensagens de erro relacionadas ao `userService`

## ✅ Checklist de Verificação

- [ ] Script de limpeza executado com sucesso
- [ ] Script principal executado sem erros
- [ ] Usuário configurado como admin
- [ ] Função `is_admin()` retorna `true` para admin
- [ ] Função `list_users()` funciona para admin
- [ ] Função `update_user_role()` funciona para admin
- [ ] Frontend consegue atualizar cargos de usuários

## 📞 Se o Problema Persistir

1. **Verifique os logs** do Supabase e do navegador
2. **Execute os scripts** na ordem correta
3. **Confirme** que o usuário tem cargo 'admin'
4. **Teste** cada função individualmente no SQL Editor

## 🎯 Resultado Esperado

Após seguir todos os passos, o sistema deve:
- ✅ Permitir que admins vejam a lista de usuários
- ✅ Permitir que admins alterem cargos de usuários
- ✅ Mostrar mensagens de erro específicas no frontend
- ✅ Funcionar sem erros de função duplicada 