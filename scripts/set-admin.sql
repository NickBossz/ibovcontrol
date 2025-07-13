-- Script para definir um usuário como administrador
-- Execute este script no SQL Editor do Supabase

-- Substitua 'email_do_usuario@exemplo.com' pelo email do usuário que você quer tornar admin
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', 'admin')
WHERE email = 'email_do_usuario@exemplo.com';

-- Verificar se a atualização foi bem-sucedida
SELECT 
  email,
  raw_user_meta_data->>'role' as cargo,
  created_at
FROM auth.users 
WHERE email = 'email_do_usuario@exemplo.com';

-- Listar todos os usuários e seus cargos
SELECT 
  email,
  raw_user_meta_data->>'role' as cargo,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC; 