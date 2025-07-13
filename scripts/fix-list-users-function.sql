-- Script para corrigir a função list_users
-- Execute este script no SQL Editor do Supabase

-- 1. Remover função existente se houver
DROP FUNCTION IF EXISTS public.list_users();

-- 2. Verificar se a função is_admin existe
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'is_admin';

-- 3. Recriar a função list_users com melhor tratamento de erros
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
  is_user_admin BOOLEAN;
BEGIN
  -- Obter ID do usuário atual
  current_user_id := auth.uid();
  
  -- Verificar se há usuário autenticado
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Verificar se o usuário é admin
  SELECT public.is_admin(current_user_id) INTO is_user_admin;
  
  IF NOT is_user_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem listar usuários. Usuário atual: %', current_user_id;
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
  RAISE NOTICE 'Função list_users executada com sucesso para usuário: %', current_user_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro na função list_users: %', SQLERRM;
    RAISE;
END;
$$;

-- 4. Garantir permissões
GRANT EXECUTE ON FUNCTION public.list_users() TO authenticated;

-- 5. Adicionar comentário
COMMENT ON FUNCTION public.list_users() IS 'Lista todos os usuários do sistema. Apenas administradores podem executar.';

-- 6. Testar a função
-- Primeiro, verificar se há usuários admin
SELECT 
  'Verificando usuários admin' as info,
  COUNT(*) as total_users,
  COUNT(CASE WHEN raw_user_meta_data->>'role' = 'admin' THEN 1 END) as admin_users
FROM auth.users;

-- 7. Tentar executar a função (apenas se você for admin)
-- Se você não for admin, isso vai dar erro (que é o comportamento esperado)
SELECT * FROM public.list_users();

-- 8. Verificar se a função foi criada corretamente
SELECT 
  routine_name,
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'list_users'; 