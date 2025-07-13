-- =====================================================
-- SCRIPT PARA VERIFICAR COLUNAS DA TABELA auth.users
-- =====================================================

-- Execute este script no SQL Editor do Supabase para ver quais colunas existem

-- =====================================================
-- VERIFICAR TODAS AS COLUNAS DA TABELA auth.users
-- =====================================================

SELECT 'Todas as colunas da tabela auth.users:' as titulo;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users' 
ORDER BY ordinal_position;

-- =====================================================
-- VERIFICAR COLUNAS DE METADADOS ESPECIFICAMENTE
-- =====================================================

SELECT 'Verificando colunas de metadados:' as titulo;

SELECT 
  column_name,
  data_type,
  CASE 
    WHEN column_name = 'user_metadata' THEN '✅ user_metadata'
    WHEN column_name = 'raw_user_meta_data' THEN '✅ raw_user_meta_data'
    ELSE '❌ Outra coluna'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users' 
AND column_name IN ('user_metadata', 'raw_user_meta_data');

-- =====================================================
-- VERIFICAR ESTRUTURA DE METADADOS
-- =====================================================

SELECT 'Verificando estrutura de metadados:' as titulo;

-- Tentar verificar user_metadata se existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'user_metadata'
  ) THEN
    RAISE NOTICE 'Coluna user_metadata existe';
    -- Tentar ver um exemplo de dados
    BEGIN
      RAISE NOTICE 'Exemplo de user_metadata: %', (
        SELECT user_metadata::text 
        FROM auth.users 
        LIMIT 1
      );
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao ler user_metadata: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Coluna user_metadata NÃO existe';
  END IF;
END $$;

-- Tentar verificar raw_user_meta_data se existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'raw_user_meta_data'
  ) THEN
    RAISE NOTICE 'Coluna raw_user_meta_data existe';
    -- Tentar ver um exemplo de dados
    BEGIN
      RAISE NOTICE 'Exemplo de raw_user_meta_data: %', (
        SELECT raw_user_meta_data::text 
        FROM auth.users 
        LIMIT 1
      );
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao ler raw_user_meta_data: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Coluna raw_user_meta_data NÃO existe';
  END IF;
END $$;

-- =====================================================
-- VERIFICAR DADOS DE USUÁRIOS
-- =====================================================

SELECT 'Verificando dados de usuários:' as titulo;

SELECT 
  id,
  email,
  created_at,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'auth' 
      AND table_name = 'users' 
      AND column_name = 'user_metadata'
    ) THEN user_metadata->>'role'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'auth' 
      AND table_name = 'users' 
      AND column_name = 'raw_user_meta_data'
    ) THEN raw_user_meta_data->>'role'
    ELSE 'N/A'
  END as role
FROM auth.users 
LIMIT 5;

-- =====================================================
-- TESTAR ATUALIZAÇÃO DE METADADOS
-- =====================================================

SELECT 'Testando atualização de metadados:' as titulo;

-- Testar com user_metadata se existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'user_metadata'
  ) THEN
    RAISE NOTICE 'Testando atualização em user_metadata...';
    -- Não fazer nada, apenas verificar se a coluna existe
    RAISE NOTICE 'Coluna user_metadata está disponível para atualização';
  END IF;
END $$;

-- Testar com raw_user_meta_data se existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'raw_user_meta_data'
  ) THEN
    RAISE NOTICE 'Testando atualização em raw_user_meta_data...';
    -- Não fazer nada, apenas verificar se a coluna existe
    RAISE NOTICE 'Coluna raw_user_meta_data está disponível para atualização';
  END IF;
END $$;

-- =====================================================
-- RECOMENDAÇÕES
-- =====================================================

SELECT 'RECOMENDAÇÕES:' as titulo;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'auth' 
      AND table_name = 'users' 
      AND column_name = 'user_metadata'
    ) THEN '✅ Use user_metadata - coluna padrão do Supabase'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'auth' 
      AND table_name = 'users' 
      AND column_name = 'raw_user_meta_data'
    ) THEN '✅ Use raw_user_meta_data - coluna alternativa'
    ELSE '❌ Nenhuma coluna de metadados encontrada'
  END as recomendacao; 