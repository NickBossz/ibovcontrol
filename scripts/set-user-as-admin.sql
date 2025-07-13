-- Script para configurar um usuário como admin
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar usuários existentes
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Configurar o primeiro usuário como admin
-- Substitua 'seu_email@exemplo.com' pelo seu email real
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', 'admin')
WHERE email = 'seu_email@exemplo.com';

-- 3. Verificar se a atualização foi bem-sucedida
SELECT 
  email,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users 
WHERE email = 'seu_email@exemplo.com';

-- 4. Verificar todos os usuários após a atualização
SELECT 
  email,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- 5. Testar se a função is_admin funciona
SELECT 
  'Teste is_admin' as teste,
  public.is_admin() as resultado; 