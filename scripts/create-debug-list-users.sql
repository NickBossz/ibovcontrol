-- Função list_users que funciona no SQL Editor e no frontend
-- Execute este script no SQL Editor do Supabase

-- 1. Remover função existente se houver
DROP FUNCTION IF EXISTS public.list_users();

-- 2. Criar função que funciona em ambos os contextos
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
DECLARE
  current_user_id UUID;
  current_role TEXT;
BEGIN
  -- Obter ID do usuário atual
  current_user_id := auth.uid();
  
  -- Obter o role atual da sessão
  current_role := current_setting('role', true);
  
  -- Se não há usuário autenticado (SQL Editor), permitir execução
  IF current_user_id IS NULL THEN
    -- No SQL Editor, permitir execução para debugging
    RAISE NOTICE 'Executando list_users no SQL Editor (modo debug)';
  ELSE
    -- Verificar se o usuário é admin
    IF NOT public.is_admin(current_user_id) THEN
      RAISE EXCEPTION 'Apenas administradores podem listar usuários. Usuário atual: %', current_user_id;
    END IF;
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
  
  -- Log para debug
  IF current_user_id IS NOT NULL THEN
    RAISE NOTICE 'Função list_users executada para usuário autenticado: %', current_user_id;
  ELSE
    RAISE NOTICE 'Função list_users executada no SQL Editor';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro na função list_users: %', SQLERRM;
    RAISE;
END;
$$;

-- 3. Garantir permissões
GRANT EXECUTE ON FUNCTION public.list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_users() TO service_role;

-- 4. Adicionar comentário
COMMENT ON FUNCTION public.list_users() IS 'Lista todos os usuários do sistema. Funciona no SQL Editor e para admins autenticados.';

-- 5. Testar a função (agora deve funcionar no SQL Editor)
SELECT * FROM public.list_users();

-- 6. Verificar se a função foi criada
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'list_users';

-- 7. Verificar usuários e seus cargos
SELECT 
  'Usuários no sistema' as info,
  COUNT(*) as total_users,
  COUNT(CASE WHEN raw_user_meta_data->>'role' = 'admin' THEN 1 END) as admin_users,
  COUNT(CASE WHEN raw_user_meta_data->>'role' = 'cliente' THEN 1 END) as client_users
FROM auth.users;

-- 8. Mostrar detalhes dos usuários
SELECT 
  email,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
ORDER BY created_at DESC; 