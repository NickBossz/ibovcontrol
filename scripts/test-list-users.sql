-- Script de teste para verificar a função list_users
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a função existe
SELECT 
  routine_name,
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'list_users';

-- 2. Verificar se o usuário atual é admin
SELECT 
  auth.uid() as current_user_id,
  is_admin() as is_current_user_admin;

-- 3. Verificar usuários na tabela auth.users
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 4. Tentar executar a função list_users (apenas se for admin)
-- Se você for admin, isso deve funcionar
-- Se não for admin, deve dar erro
SELECT * FROM list_users();

-- 5. Verificar se há algum problema com a função is_admin
SELECT 
  'is_admin function test' as test_name,
  is_admin() as result;

-- 6. Verificar permissões da função
SELECT 
  p.proname as function_name,
  p.proacl as permissions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'list_users';

-- 7. Verificar se há triggers ou políticas que possam estar interferindo
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'users';

-- 8. Teste alternativo: criar uma versão simplificada da função
CREATE OR REPLACE FUNCTION test_list_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Retornar lista de usuários sem verificação de admin (apenas para teste)
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'role', 'cliente') as role,
    au.created_at,
    au.last_sign_in_at
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$;

-- Testar a função simplificada
SELECT * FROM test_list_users();

-- Limpar função de teste
DROP FUNCTION IF EXISTS test_list_users(); 