-- Função list_users simples para testes
-- Execute este script no SQL Editor do Supabase

-- 1. Remover função existente se houver
DROP FUNCTION IF EXISTS public.list_users();

-- 2. Criar função simples sem verificação de autenticação
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
  -- Retornar lista de usuários sem verificação (apenas para testes)
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
GRANT EXECUTE ON FUNCTION public.list_users() TO service_role;

-- 4. Adicionar comentário
COMMENT ON FUNCTION public.list_users() IS 'Lista todos os usuários do sistema (versão simples para testes).';

-- 5. Testar a função (deve funcionar agora)
SELECT * FROM public.list_users();

-- 6. Verificar se a função foi criada
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'list_users';

-- 7. Mostrar usuários
SELECT 
  email,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
ORDER BY created_at DESC; 