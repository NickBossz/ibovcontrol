-- Script passo a passo para configurar o Supabase
-- Execute cada seção separadamente no SQL Editor

-- ==========================================
-- ETAPA 1: Criar tabelas
-- ==========================================

-- Criar tabela de carteira
CREATE TABLE IF NOT EXISTS carteira (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ativo_codigo TEXT NOT NULL,
  quantidade DECIMAL(10,2) NOT NULL,
  preco_medio DECIMAL(10,2) NOT NULL,
  data_compra DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de suportes e resistências
CREATE TABLE IF NOT EXISTS suportes_resistencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ativo_codigo TEXT NOT NULL,
  ativo_nome TEXT NOT NULL,
  suporte1 DECIMAL(10,2),
  suporte2 DECIMAL(10,2),
  resistencia1 DECIMAL(10,2),
  resistencia2 DECIMAL(10,2),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ultima_modificacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ETAPA 2: Criar índices
-- ==========================================

-- Índices para carteira
CREATE INDEX IF NOT EXISTS idx_carteira_user_id ON carteira(user_id);
CREATE INDEX IF NOT EXISTS idx_carteira_ativo_codigo ON carteira(ativo_codigo);
CREATE INDEX IF NOT EXISTS idx_carteira_created_at ON carteira(created_at);

-- Índices para suportes e resistências
CREATE INDEX IF NOT EXISTS idx_suportes_resistencias_ativo ON suportes_resistencias(ativo_codigo);
CREATE INDEX IF NOT EXISTS idx_suportes_resistencias_admin ON suportes_resistencias(admin_id);
CREATE INDEX IF NOT EXISTS idx_suportes_resistencias_created ON suportes_resistencias(created_at);

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

-- Função para listar usuários
CREATE OR REPLACE FUNCTION list_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  last_sign_in_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem listar usuários';
  END IF;
  
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'role', 'cliente') as role,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  ORDER BY u.created_at DESC;
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

-- ==========================================
-- ETAPA 6: Criar políticas RLS
-- ==========================================

-- Políticas para carteira
DROP POLICY IF EXISTS "Users can view own carteira" ON carteira;
CREATE POLICY "Users can view own carteira" ON carteira
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own carteira" ON carteira;
CREATE POLICY "Users can insert own carteira" ON carteira
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own carteira" ON carteira;
CREATE POLICY "Users can update own carteira" ON carteira
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own carteira" ON carteira;
CREATE POLICY "Users can delete own carteira" ON carteira
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para suportes e resistências
DROP POLICY IF EXISTS "Admins can view suportes_resistencias" ON suportes_resistencias;
CREATE POLICY "Admins can view suportes_resistencias" ON suportes_resistencias
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert suportes_resistencias" ON suportes_resistencias;
CREATE POLICY "Admins can insert suportes_resistencias" ON suportes_resistencias
  FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update suportes_resistencias" ON suportes_resistencias;
CREATE POLICY "Admins can update suportes_resistencias" ON suportes_resistencias
  FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "Admins can delete suportes_resistencias" ON suportes_resistencias;
CREATE POLICY "Admins can delete suportes_resistencias" ON suportes_resistencias
  FOR DELETE USING (is_admin());

-- ==========================================
-- ETAPA 7: Verificações
-- ==========================================

-- Verificar tabelas
SELECT 'carteira' as tabela, COUNT(*) as total FROM carteira
UNION ALL
SELECT 'suportes_resistencias' as tabela, COUNT(*) as total FROM suportes_resistencias;

-- Verificar funções
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_admin', 'is_client', 'get_user_role', 'update_user_role', 'list_users');

-- Verificar políticas
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE tablename IN ('carteira', 'suportes_resistencias');

-- Mostrar usuários
SELECT 
  email,
  raw_user_meta_data->>'role' as cargo,
  created_at
FROM auth.users
ORDER BY created_at DESC; 