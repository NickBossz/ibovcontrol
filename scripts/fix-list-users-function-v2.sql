-- Script para corrigir a função list_users - Versão 2
-- Execute este script no SQL Editor do Supabase

-- 1. Remover função existente se houver
DROP FUNCTION IF EXISTS public.list_users();

-- 2. Recriar a função list_users com melhor tratamento de autenticação
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
  
  -- Se não há usuário autenticado (como no SQL Editor), permitir execução
  -- mas apenas se for executado por um superuser ou service_role
  IF current_user_id IS NULL THEN
    -- Verificar se é uma execução privilegiada (SQL Editor ou service_role)
    IF current_setting('role') = 'service_role' OR current_setting('role') = 'postgres' THEN
      -- Permitir execução para debugging
      RAISE NOTICE 'Executando list_users sem autenticação (modo debug)';
    ELSE
      RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
  ELSE
    -- Verificar se o usuário é admin
    SELECT public.is_admin(current_user_id) INTO is_user_admin;
    
    IF NOT is_user_admin THEN
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
    RAISE NOTICE 'Função list_users executada com sucesso para usuário: %', current_user_id;
  ELSE
    RAISE NOTICE 'Função list_users executada em modo debug';
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
COMMENT ON FUNCTION public.list_users() IS 'Lista todos os usuários do sistema. Apenas administradores podem executar quando autenticados.';

-- 5. Testar a função
-- Primeiro, verificar se há usuários admin
SELECT 
  'Verificando usuários admin' as info,
  COUNT(*) as total_users,
  COUNT(CASE WHEN raw_user_meta_data->>'role' = 'admin' THEN 1 END) as admin_users
FROM auth.users;

-- 6. Tentar executar a função (agora deve funcionar no SQL Editor)
SELECT * FROM public.list_users();

-- 7. Verificar se a função foi criada corretamente
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'list_users';

-- 8. Teste adicional: verificar se a função is_admin existe e funciona
SELECT 
  'Teste is_admin' as teste,
  public.is_admin() as resultado; 