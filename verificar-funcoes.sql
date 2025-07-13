-- =====================================================
-- SCRIPT PARA VERIFICAR FUNÇÕES EXISTENTES
-- =====================================================

-- Execute este script no SQL Editor do Supabase para ver quais funções existem

-- =====================================================
-- VERIFICAR TODAS AS FUNÇÕES PÚBLICAS
-- =====================================================

SELECT 'Todas as funções públicas existentes:' as titulo;

SELECT 
  routine_name,
  routine_type,
  security_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;

-- =====================================================
-- VERIFICAR FUNÇÕES ESPECÍFICAS DO SISTEMA
-- =====================================================

SELECT 'Verificando funções específicas do sistema:' as titulo;

SELECT 
  routine_name,
  CASE 
    WHEN routine_name IN ('is_admin', 'get_user_role', 'update_user_role', 'update_user_role_simple', 'list_users') 
    THEN '✅ EXISTE' 
    ELSE '❌ NÃO EXISTE' 
  END as status
FROM (
  SELECT 'is_admin' as routine_name
  UNION SELECT 'get_user_role'
  UNION SELECT 'update_user_role'
  UNION SELECT 'update_user_role_simple'
  UNION SELECT 'list_users'
) as expected_functions
LEFT JOIN information_schema.routines r 
  ON r.routine_name = expected_functions.routine_name 
  AND r.routine_schema = 'public'
ORDER BY routine_name;

-- =====================================================
-- VERIFICAR FUNÇÕES DUPLICADAS
-- =====================================================

SELECT 'Verificando funções duplicadas:' as titulo;

SELECT 
  routine_name,
  COUNT(*) as quantidade,
  STRING_AGG(routine_type || ' (' || security_type || ')', ', ') as tipos
FROM information_schema.routines 
WHERE routine_schema = 'public' 
GROUP BY routine_name
HAVING COUNT(*) > 1
ORDER BY routine_name;

-- =====================================================
-- VERIFICAR PERMISSÕES DAS FUNÇÕES
-- =====================================================

SELECT 'Verificando permissões das funções:' as titulo;

SELECT 
  routine_name,
  routine_type,
  security_type,
  CASE 
    WHEN security_type = 'DEFINER' THEN '✅ SECURITY DEFINER'
    ELSE '⚠️ SECURITY INVOKER'
  END as security_status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_admin', 'get_user_role', 'update_user_role', 'update_user_role_simple', 'list_users')
ORDER BY routine_name;

-- =====================================================
-- VERIFICAR SE O USUÁRIO ATUAL É ADMIN
-- =====================================================

SELECT 'Verificando cargo do usuário atual:' as titulo;

SELECT 
  id,
  email,
  user_metadata->>'role' as role,
  CASE 
    WHEN user_metadata->>'role' = 'admin' THEN '✅ ADMIN'
    WHEN user_metadata->>'role' = 'cliente' THEN '👤 CLIENTE'
    ELSE '❓ SEM CARGO DEFINIDO'
  END as status
FROM auth.users 
WHERE id = auth.uid();

-- =====================================================
-- TESTAR FUNÇÕES (SE EXISTIREM)
-- =====================================================

SELECT 'Testando funções (se existirem):' as titulo;

-- Testar is_admin se existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'is_admin'
  ) THEN
    RAISE NOTICE 'is_admin() retorna: %', public.is_admin();
  ELSE
    RAISE NOTICE 'Função is_admin() não existe';
  END IF;
END $$;

-- Testar get_user_role se existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'get_user_role'
  ) THEN
    RAISE NOTICE 'get_user_role() retorna: %', public.get_user_role();
  ELSE
    RAISE NOTICE 'Função get_user_role() não existe';
  END IF;
END $$;

-- =====================================================
-- RESUMO
-- =====================================================

SELECT 'RESUMO DA VERIFICAÇÃO:' as titulo;

SELECT 
  'Funções necessárias' as categoria,
  COUNT(*) as total,
  SUM(CASE WHEN r.routine_name IS NOT NULL THEN 1 ELSE 0 END) as existem,
  SUM(CASE WHEN r.routine_name IS NULL THEN 1 ELSE 0 END) as faltam
FROM (
  SELECT 'is_admin' as routine_name
  UNION SELECT 'get_user_role'
  UNION SELECT 'update_user_role'
  UNION SELECT 'update_user_role_simple'
  UNION SELECT 'list_users'
) as expected_functions
LEFT JOIN information_schema.routines r 
  ON r.routine_name = expected_functions.routine_name 
  AND r.routine_schema = 'public';

-- =====================================================
-- PRÓXIMOS PASSOS
-- =====================================================

SELECT 'PRÓXIMOS PASSOS:' as titulo;

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ Nenhuma função existe. Execute o supabase-setup.sql completo.'
    WHEN COUNT(*) < 5 THEN '⚠️ Algumas funções faltam. Execute o add-update-user-role.sql.'
    ELSE '✅ Todas as funções existem. Sistema pronto!'
  END as recomendacao
FROM (
  SELECT 'is_admin' as routine_name
  UNION SELECT 'get_user_role'
  UNION SELECT 'update_user_role'
  UNION SELECT 'update_user_role_simple'
  UNION SELECT 'list_users'
) as expected_functions
LEFT JOIN information_schema.routines r 
  ON r.routine_name = expected_functions.routine_name 
  AND r.routine_schema = 'public'
WHERE r.routine_name IS NULL; 