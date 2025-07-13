-- =====================================================
-- SCRIPT DE TESTE PARA FUNÇÕES DO SUPABASE
-- =====================================================

-- Este script deve ser executado no SQL Editor do Supabase
-- para verificar se as funções estão funcionando corretamente

-- 1. Testar se a função is_admin() está funcionando
SELECT 'Testando is_admin()' as teste;
SELECT public.is_admin() as is_admin_result;

-- 2. Testar se a função get_user_role() está funcionando
SELECT 'Testando get_user_role()' as teste;
SELECT public.get_user_role() as current_user_role;

-- 3. Testar se a função list_users() está funcionando (apenas para admins)
SELECT 'Testando list_users()' as teste;
SELECT * FROM public.list_users() LIMIT 5;

-- 4. Verificar se as tabelas existem
SELECT 'Verificando tabelas' as teste;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('carteira', 'suportes_resistencias');

-- 5. Verificar se as funções existem
SELECT 'Verificando funções' as teste;
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'is_admin', 
  'get_user_role', 
  'update_user_role', 
  'update_user_role_simple',
  'list_users'
);

-- 6. Verificar permissões das funções
SELECT 'Verificando permissões' as teste;
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'is_admin', 
  'get_user_role', 
  'update_user_role', 
  'update_user_role_simple',
  'list_users'
);

-- 7. Testar se o usuário atual tem cargo definido
SELECT 'Verificando cargo do usuário atual' as teste;
SELECT 
  id,
  email,
  user_metadata->>'role' as role,
  created_at
FROM auth.users 
WHERE id = auth.uid();

-- 8. Verificar se RLS está habilitado nas tabelas
SELECT 'Verificando RLS' as teste;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('carteira', 'suportes_resistencias');

-- 9. Verificar políticas RLS
SELECT 'Verificando políticas RLS' as teste;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('carteira', 'suportes_resistencias');

-- 10. Testar função update_user_role_simple (apenas se for admin)
SELECT 'Testando update_user_role_simple (apenas se for admin)' as teste;
-- Esta função retorna FALSE se não for admin, TRUE se for admin e conseguir atualizar
-- Vamos testar com um ID inválido para ver se a função funciona
SELECT public.update_user_role_simple('00000000-0000-0000-0000-000000000000', 'cliente') as test_result;

-- =====================================================
-- INSTRUÇÕES PARA RESOLVER PROBLEMAS
-- =====================================================

/*
Se algum teste falhar, execute os seguintes passos:

1. Verificar se o script supabase-setup.sql foi executado completamente
2. Verificar se o usuário atual tem cargo 'admin' definido
3. Verificar se as permissões estão corretas
4. Verificar se as funções foram criadas corretamente

Para definir um usuário como admin, execute:
UPDATE auth.users 
SET user_metadata = jsonb_set(
  COALESCE(user_metadata, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'seu-email@exemplo.com';

Para verificar logs de erro, vá para:
Supabase Dashboard > Logs > Database Logs
*/ 