-- Função list_users específica para o frontend
-- Execute este script no SQL Editor do Supabase

-- 1. Remover função existente se houver
DROP FUNCTION IF EXISTS public.list_users();

-- 2. Criar função simplificada para o frontend
CREATE OR REPLACE FUNCTION public.list_users()
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
  -- Verificar se o usuário atual é admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem listar usuários';
  END IF;
  
  -- Retornar lista de usuários
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

-- 3. Garantir permissões
GRANT EXECUTE ON FUNCTION public.list_users() TO authenticated;

-- 4. Adicionar comentário
COMMENT ON FUNCTION public.list_users() IS 'Lista todos os usuários do sistema. Apenas administradores podem executar.';

-- 5. Testar se a função is_admin existe
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'is_admin';

-- 6. Verificar usuários e seus cargos
SELECT 
  email,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- 7. Testar a função (apenas se você for admin)
-- Se você não for admin, isso vai dar erro (comportamento esperado)
SELECT * FROM public.list_users(); 