-- Script para verificar usuários e configurar admin
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar todos os usuários e seus cargos
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Verificar se há algum usuário admin
SELECT 
  'Status dos usuários' as info,
  COUNT(*) as total_users,
  COUNT(CASE WHEN raw_user_meta_data->>'role' = 'admin' THEN 1 END) as admin_users,
  COUNT(CASE WHEN raw_user_meta_data->>'role' = 'cliente' THEN 1 END) as client_users,
  COUNT(CASE WHEN raw_user_meta_data->>'role' IS NULL THEN 1 END) as users_without_role
FROM auth.users;

-- 3. Configurar o primeiro usuário como admin (substitua o email)
-- Descomente e modifique a linha abaixo com o email do usuário que você quer tornar admin
-- UPDATE auth.users 
-- SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
--     jsonb_build_object('role', 'admin')
-- WHERE email = 'seu_email@exemplo.com';

-- 4. Verificar se a função is_admin funciona
SELECT 
  'Teste is_admin' as teste,
  public.is_admin() as resultado;

-- 5. Testar a função list_users (apenas se você for admin)
-- Se você não for admin, isso vai dar erro (comportamento esperado)
SELECT * FROM public.list_users();

-- 6. Verificar se as funções existem
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_admin', 'list_users')
ORDER BY routine_name; 