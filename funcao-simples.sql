-- =====================================================
-- SCRIPT SIMPLES PARA CRIAR FUNÇÃO update_user_role
-- =====================================================

-- Este script cria a função update_user_role de forma simples e direta
-- Execute este script no SQL Editor do Supabase

-- =====================================================
-- FUNÇÃO update_user_role (VERSÃO SIMPLIFICADA)
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id uuid, new_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  user_exists boolean;
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

  -- Tentar atualizar usando user_metadata primeiro
  BEGIN
    UPDATE auth.users 
    SET user_metadata = jsonb_set(
      COALESCE(user_metadata, '{}'::jsonb),
      '{role}',
      to_jsonb(new_role)
    )
    WHERE id = target_user_id;
    
    IF FOUND THEN
      RETURN TRUE;
    END IF;
  EXCEPTION
    WHEN undefined_column THEN
      -- Se user_metadata não existe, tentar com raw_user_meta_data
      UPDATE auth.users 
      SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{role}',
        to_jsonb(new_role)
      )
      WHERE id = target_user_id;
      
      IF FOUND THEN
        RETURN TRUE;
      END IF;
  END;

  RETURN FALSE;
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

CREATE OR REPLACE FUNCTION public.update_user_role_simple(target_user_id uuid, new_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_admin() THEN
    RETURN FALSE;
  END IF;

  -- Tentar atualizar usando user_metadata primeiro
  BEGIN
    UPDATE auth.users 
    SET user_metadata = jsonb_set(
      COALESCE(user_metadata, '{}'::jsonb),
      '{role}',
      to_jsonb(new_role)
    )
    WHERE id = target_user_id;
    
    IF FOUND THEN
      RETURN TRUE;
    END IF;
  EXCEPTION
    WHEN undefined_column THEN
      -- Se user_metadata não existe, tentar com raw_user_meta_data
      UPDATE auth.users 
      SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{role}',
        to_jsonb(new_role)
      )
      WHERE id = target_user_id;
      
      RETURN FOUND;
  END;

  RETURN FALSE;
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