-- Script para corrigir o tipo de dados da função list_users
-- Execute este script no SQL Editor do Supabase

-- 1. Remover função existente
DROP FUNCTION IF EXISTS public.list_users();

-- 2. Recriar função com tipos corretos
CREATE OR REPLACE FUNCTION public.list_users()
RETURNS TABLE (
  id UUID,
  email VARCHAR(255),
  role TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Retornar lista de usuários sem verificação (funciona no SQL Editor e para admins)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Garantir permissões
GRANT EXECUTE ON FUNCTION public.list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_users() TO service_role;

-- 4. Testar a função
SELECT * FROM public.list_users();

-- 5. Verificar se funcionou
SELECT 
  'Função list_users corrigida com sucesso!' as status,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'list_users'; 