-- =====================================================
-- SCRIPT PARA ADICIONAR FUNÇÃO update_user_role
-- =====================================================

-- Este script adiciona apenas a função update_user_role que está faltando
-- Execute este script no SQL Editor do Supabase

-- =====================================================
-- PRÉ-REQUISITOS
-- =====================================================

-- Verificar se a função is_admin existe (necessária para update_user_role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'is_admin'
  ) THEN
    RAISE EXCEPTION 'Função is_admin() não encontrada. Execute primeiro o supabase-setup.sql';
  END IF;
END $$;

-- Verificar qual é o nome correto da coluna de metadados
DO $$
DECLARE
  metadata_col text;
BEGIN
  -- Verificar se user_metadata existe
  SELECT c.column_name INTO metadata_col
  FROM information_schema.columns c
  WHERE c.table_schema = 'auth' 
  AND c.table_name = 'users' 
  AND c.column_name = 'user_metadata';
  
  IF metadata_col IS NULL THEN
    -- Verificar se raw_user_meta_data existe
    SELECT c.column_name INTO metadata_col
    FROM information_schema.columns c
    WHERE c.table_schema = 'auth' 
    AND c.table_name = 'users' 
    AND c.column_name = 'raw_user_meta_data';
    
    IF metadata_col IS NULL THEN
      RAISE EXCEPTION 'Nenhuma coluna de metadados encontrada em auth.users';
    ELSE
      RAISE NOTICE 'Usando coluna: raw_user_meta_data';
    END IF;
  ELSE
    RAISE NOTICE 'Usando coluna: user_metadata';
  END IF;
END $$;

-- =====================================================
-- FUNÇÃO update_user_role
-- =====================================================

-- Função para atualizar cargo de um usuário (apenas admins)
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id uuid, new_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  user_exists boolean;
  metadata_column text;
BEGIN
  -- Obter o ID do usuário atual
  current_user_id := auth.uid();
  
  -- Verificar se o usuário atual existe
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verificar se o usuário atual é admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar cargos';
  END IF;

  -- Verificar se o cargo é válido
  IF new_role NOT IN ('cliente', 'admin') THEN
    RAISE EXCEPTION 'Cargo inválido. Use "cliente" ou "admin"';
  END IF;

  -- Verificar se o usuário alvo existe
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = target_user_id) INTO user_exists;
  IF NOT user_exists THEN
    RAISE EXCEPTION 'Usuário alvo não encontrado';
  END IF;

  -- Verificar se não está tentando alterar o próprio cargo
  IF current_user_id = target_user_id THEN
    RAISE EXCEPTION 'Não é possível alterar o próprio cargo';
  END IF;

  -- Determinar qual coluna de metadados usar
  SELECT c.column_name INTO metadata_column
  FROM information_schema.columns c
  WHERE c.table_schema = 'auth' 
  AND c.table_name = 'users' 
  AND c.column_name IN ('user_metadata', 'raw_user_meta_data')
  LIMIT 1;

  IF metadata_column IS NULL THEN
    RAISE EXCEPTION 'Nenhuma coluna de metadados encontrada em auth.users';
  END IF;

  -- Atualizar o cargo do usuário usando a coluna correta
  IF metadata_column = 'user_metadata' THEN
    UPDATE auth.users 
    SET user_metadata = jsonb_set(
      COALESCE(user_metadata, '{}'::jsonb),
      '{role}',
      to_jsonb(new_role)
    )
    WHERE id = target_user_id;
  ELSE
    UPDATE auth.users 
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb(new_role)
    )
    WHERE id = target_user_id;
  END IF;

  -- Verificar se a atualização foi bem-sucedida
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Falha ao atualizar cargo do usuário';
  END IF;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro para debug
    RAISE LOG 'Erro em update_user_role: %', SQLERRM;
    RAISE;
END;
$$;

-- =====================================================
-- FUNÇÃO update_user_role_simple (ALTERNATIVA)
-- =====================================================

-- Função alternativa mais simples para atualizar cargo
CREATE OR REPLACE FUNCTION public.update_user_role_simple(target_user_id uuid, new_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  metadata_column text;
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_admin() THEN
    RETURN FALSE;
  END IF;

  -- Determinar qual coluna de metadados usar
  SELECT c.column_name INTO metadata_column
  FROM information_schema.columns c
  WHERE c.table_schema = 'auth' 
  AND c.table_name = 'users' 
  AND c.column_name IN ('user_metadata', 'raw_user_meta_data')
  LIMIT 1;

  IF metadata_column IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Atualizar o cargo do usuário usando a coluna correta
  IF metadata_column = 'user_metadata' THEN
    UPDATE auth.users 
    SET user_metadata = jsonb_set(
      COALESCE(user_metadata, '{}'::jsonb),
      '{role}',
      to_jsonb(new_role)
    )
    WHERE id = target_user_id;
  ELSE
    UPDATE auth.users 
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb(new_role)
    )
    WHERE id = target_user_id;
  END IF;

  RETURN FOUND;
END;
$$;

-- =====================================================
-- PERMISSÕES
-- =====================================================

-- Conceder permissões para executar as funções
GRANT EXECUTE ON FUNCTION public.update_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_role_simple(uuid, text) TO authenticated;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION public.update_user_role(uuid, text) IS 'Atualiza o cargo de um usuário (apenas admins) - versão completa';
COMMENT ON FUNCTION public.update_user_role_simple(uuid, text) IS 'Atualiza o cargo de um usuário (apenas admins) - versão simplificada';

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se as funções foram criadas
SELECT 'Verificando se as funções foram criadas' as status;

SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_user_role', 'update_user_role_simple')
ORDER BY routine_name;

-- =====================================================
-- TESTE SIMPLES
-- =====================================================

-- Testar se a função is_admin() está funcionando
SELECT 'Testando is_admin()' as teste;
SELECT public.is_admin() as is_admin_result;

-- Testar se a função update_user_role_simple funciona (retorna FALSE se não for admin)
SELECT 'Testando update_user_role_simple' as teste;
SELECT public.update_user_role_simple('00000000-0000-0000-0000-000000000000', 'cliente') as test_result;

-- =====================================================
-- MENSAGEM DE CONFIRMAÇÃO
-- =====================================================

SELECT 'Funções update_user_role criadas com sucesso!' as resultado; 