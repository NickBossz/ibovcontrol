-- ==========================================
-- SCRIPT COMPLETO PARA CONFIGURAÇÃO DO SUPABASE
-- Execute este script no SQL Editor do Supabase
-- ==========================================

-- ==========================================
-- ETAPA 1: Criar tabelas
-- ==========================================

-- Tabela carteira
CREATE TABLE IF NOT EXISTS carteira (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ativo_codigo TEXT NOT NULL,
  quantidade DECIMAL(10,2) NOT NULL,
  preco_medio DECIMAL(10,2) NOT NULL,
  data_compra DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela suportes e resistências
CREATE TABLE IF NOT EXISTS suportes_resistencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ativo_codigo TEXT NOT NULL UNIQUE,
  ativo_nome TEXT NOT NULL,
  suporte1 DECIMAL(10,2),
  suporte2 DECIMAL(10,2),
  resistencia1 DECIMAL(10,2),
  resistencia2 DECIMAL(10,2),
  admin_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultima_modificacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ETAPA 2: Criar índices
-- ==========================================

-- Índices para carteira
CREATE INDEX IF NOT EXISTS idx_carteira_user_id ON carteira(user_id);
CREATE INDEX IF NOT EXISTS idx_carteira_ativo ON carteira(ativo_codigo);

-- Índices para suportes e resistências
CREATE INDEX IF NOT EXISTS idx_suportes_resistencias_ativo ON suportes_resistencias(ativo_codigo);
CREATE INDEX IF NOT EXISTS idx_suportes_resistencias_admin ON suportes_resistencias(admin_id);

-- ==========================================
-- ETAPA 3: Habilitar RLS
-- ==========================================

ALTER TABLE carteira ENABLE ROW LEVEL SECURITY;
ALTER TABLE suportes_resistencias ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- ETAPA 4: Criar funções básicas
-- ==========================================

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id 
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é cliente
CREATE OR REPLACE FUNCTION is_client(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id 
    AND raw_user_meta_data->>'role' = 'cliente'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter cargo do usuário
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT raw_user_meta_data->>'role' 
    FROM auth.users 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar cargo do usuário
CREATE OR REPLACE FUNCTION update_user_role(target_user_id UUID, new_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar cargos';
  END IF;
  
  -- Verificar se o cargo é válido
  IF new_role NOT IN ('cliente', 'admin') THEN
    RAISE EXCEPTION 'Cargo inválido. Use "cliente" ou "admin"';
  END IF;
  
  -- Atualizar o cargo
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', new_role)
  WHERE id = target_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para listar usuários (versão simples para funcionar no SQL Editor e frontend)
CREATE OR REPLACE FUNCTION list_users()
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

-- ==========================================
-- ETAPA 5: Criar triggers
-- ==========================================

-- Trigger para carteira
DROP TRIGGER IF EXISTS update_carteira_updated_at ON carteira;
CREATE TRIGGER update_carteira_updated_at
  BEFORE UPDATE ON carteira
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para suportes e resistências
DROP TRIGGER IF EXISTS update_suportes_resistencias_updated_at ON suportes_resistencias;
CREATE TRIGGER update_suportes_resistencias_updated_at
  BEFORE UPDATE ON suportes_resistencias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar última modificação
DROP TRIGGER IF EXISTS update_suportes_resistencias_ultima_modificacao ON suportes_resistencias;
CREATE TRIGGER update_suportes_resistencias_ultima_modificacao
  BEFORE UPDATE ON suportes_resistencias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- ETAPA 6: Criar políticas RLS
-- ==========================================

-- Políticas para carteira
DROP POLICY IF EXISTS carteira_select_policy ON carteira;
CREATE POLICY carteira_select_policy ON carteira
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS carteira_insert_policy ON carteira;
CREATE POLICY carteira_insert_policy ON carteira
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS carteira_update_policy ON carteira;
CREATE POLICY carteira_update_policy ON carteira
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS carteira_delete_policy ON carteira;
CREATE POLICY carteira_delete_policy ON carteira
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para suportes e resistências (apenas admins)
DROP POLICY IF EXISTS suportes_resistencias_select_policy ON suportes_resistencias;
CREATE POLICY suportes_resistencias_select_policy ON suportes_resistencias
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS suportes_resistencias_insert_policy ON suportes_resistencias;
CREATE POLICY suportes_resistencias_insert_policy ON suportes_resistencias
  FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS suportes_resistencias_update_policy ON suportes_resistencias;
CREATE POLICY suportes_resistencias_update_policy ON suportes_resistencias
  FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS suportes_resistencias_delete_policy ON suportes_resistencias;
CREATE POLICY suportes_resistencias_delete_policy ON suportes_resistencias
  FOR DELETE USING (is_admin());

-- ==========================================
-- ETAPA 7: Garantir permissões
-- ==========================================

GRANT EXECUTE ON FUNCTION list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION list_users() TO service_role;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_client(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_role(UUID, TEXT) TO authenticated;

-- ==========================================
-- ETAPA 8: Adicionar comentários
-- ==========================================

COMMENT ON TABLE carteira IS 'Tabela para armazenar os ativos da carteira dos usuários';
COMMENT ON TABLE suportes_resistencias IS 'Tabela para armazenar suportes e resistências dos ativos';
COMMENT ON FUNCTION is_admin(UUID) IS 'Verifica se o usuário é administrador';
COMMENT ON FUNCTION is_client(UUID) IS 'Verifica se o usuário é cliente';
COMMENT ON FUNCTION get_user_role(UUID) IS 'Retorna o cargo do usuário';
COMMENT ON FUNCTION update_user_role(UUID, TEXT) IS 'Atualiza o cargo de um usuário (apenas admins)';
COMMENT ON FUNCTION list_users() IS 'Lista todos os usuários do sistema';

-- ==========================================
-- ETAPA 9: Verificações e testes
-- ==========================================

-- Verificar se as tabelas foram criadas
SELECT 
  'Tabela carteira criada com sucesso!' AS status,
  COUNT(*) AS total_rows
FROM carteira;

SELECT 
  'Tabela suportes_resistencias criada com sucesso!' AS status,
  COUNT(*) AS total_rows
FROM suportes_resistencias;

-- Verificar se as funções foram criadas
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_admin', 'is_client', 'get_user_role', 'update_user_role', 'list_users')
ORDER BY routine_name;

-- Verificar políticas
SELECT 
  schemaname, 
  tablename, 
  policyname 
FROM pg_policies 
WHERE tablename IN ('carteira', 'suportes_resistencias')
ORDER BY tablename, policyname;

-- Mostrar usuários existentes
SELECT 
  email,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- Testar função list_users
SELECT * FROM list_users();

-- ==========================================
-- ETAPA 10: Configurar usuário admin (OPCIONAL)
-- ==========================================

-- Descomente e modifique a linha abaixo para configurar um usuário como admin
-- Substitua 'seu_email@exemplo.com' pelo email do usuário que você quer tornar admin
-- UPDATE auth.users 
-- SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
--     jsonb_build_object('role', 'admin')
-- WHERE email = 'seu_email@exemplo.com';

-- Verificar se há usuários admin
SELECT 
  'Status dos usuários' as info,
  COUNT(*) as total_users,
  COUNT(CASE WHEN raw_user_meta_data->>'role' = 'admin' THEN 1 END) as admin_users,
  COUNT(CASE WHEN raw_user_meta_data->>'role' = 'cliente' THEN 1 END) as client_users,
  COUNT(CASE WHEN raw_user_meta_data->>'role' IS NULL THEN 1 END) as users_without_role
FROM auth.users;

-- ==========================================
-- FIM DO SCRIPT
-- ========================================== 