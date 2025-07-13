-- =====================================================
-- CONFIGURAÇÃO COMPLETA DO SUPABASE PARA IBOV CONTROL
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELAS
-- =====================================================

-- Tabela de carteira do usuário
CREATE TABLE IF NOT EXISTS public.carteira (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ativo_codigo text NOT NULL,
  quantidade integer NOT NULL CHECK (quantidade > 0),
  preco_medio numeric NOT NULL CHECK (preco_medio > 0::numeric),
  data_compra date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT carteira_pkey PRIMARY KEY (id),
  CONSTRAINT carteira_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela de suportes e resistências
CREATE TABLE IF NOT EXISTS public.suportes_resistencias (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  ativo_codigo text NOT NULL,
  ativo_nome text NOT NULL,
  suporte1 numeric,
  suporte2 numeric,
  resistencia1 numeric,
  resistencia2 numeric,
  admin_id uuid,
  ultima_modificacao timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT suportes_resistencias_pkey PRIMARY KEY (id),
  CONSTRAINT suportes_resistencias_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Índices para carteira
CREATE INDEX IF NOT EXISTS idx_carteira_user_id ON public.carteira(user_id);
CREATE INDEX IF NOT EXISTS idx_carteira_ativo_codigo ON public.carteira(ativo_codigo);
CREATE INDEX IF NOT EXISTS idx_carteira_created_at ON public.carteira(created_at);

-- Índices para suportes_resistencias
CREATE INDEX IF NOT EXISTS idx_suportes_resistencias_ativo_codigo ON public.suportes_resistencias(ativo_codigo);
CREATE INDEX IF NOT EXISTS idx_suportes_resistencias_admin_id ON public.suportes_resistencias(admin_id);
CREATE INDEX IF NOT EXISTS idx_suportes_resistencias_ultima_modificacao ON public.suportes_resistencias(ultima_modificacao);

-- =====================================================
-- FUNÇÕES
-- =====================================================

-- Função para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
    AND user_metadata->>'role' = 'admin'
  );
END;
$$;

-- Função para obter o cargo do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT user_metadata->>'role' 
    FROM auth.users 
    WHERE id = user_id
  );
END;
$$;

-- Função para atualizar cargo de um usuário (apenas admins)
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id uuid, new_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar cargos';
  END IF;

  -- Verificar se o cargo é válido
  IF new_role NOT IN ('cliente', 'admin') THEN
    RAISE EXCEPTION 'Cargo inválido. Use "cliente" ou "admin"';
  END IF;

  -- Atualizar o cargo do usuário
  UPDATE auth.users 
  SET user_metadata = jsonb_set(
    COALESCE(user_metadata, '{}'::jsonb),
    '{role}',
    to_jsonb(new_role)
  )
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$;

-- Função para listar usuários (apenas admins)
CREATE OR REPLACE FUNCTION public.list_users()
RETURNS TABLE (
  id uuid,
  email varchar(255),
  role text,
  created_at timestamp with time zone,
  last_sign_in_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem listar usuários';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::varchar(255),
    COALESCE(u.user_metadata->>'role', 'cliente') as role,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;

-- Função para definir cargo padrão para novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Definir cargo padrão como 'cliente' se não estiver definido
  IF NEW.user_metadata IS NULL OR NOT (NEW.user_metadata ? 'role') THEN
    NEW.user_metadata = COALESCE(NEW.user_metadata, '{}'::jsonb) || '{"role": "cliente"}'::jsonb;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Função para atualizar timestamp de modificação
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para definir cargo padrão em novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers para atualizar timestamps
DROP TRIGGER IF EXISTS update_carteira_updated_at ON public.carteira;
CREATE TRIGGER update_carteira_updated_at
  BEFORE UPDATE ON public.carteira
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_suportes_resistencias_updated_at ON public.suportes_resistencias;
CREATE TRIGGER update_suportes_resistencias_updated_at
  BEFORE UPDATE ON public.suportes_resistencias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.carteira ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suportes_resistencias ENABLE ROW LEVEL SECURITY;

-- Políticas para carteira
DROP POLICY IF EXISTS "Usuários podem ver apenas sua própria carteira" ON public.carteira;
CREATE POLICY "Usuários podem ver apenas sua própria carteira" ON public.carteira
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir em sua própria carteira" ON public.carteira;
CREATE POLICY "Usuários podem inserir em sua própria carteira" ON public.carteira
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar sua própria carteira" ON public.carteira;
CREATE POLICY "Usuários podem atualizar sua própria carteira" ON public.carteira
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar sua própria carteira" ON public.carteira;
CREATE POLICY "Usuários podem deletar sua própria carteira" ON public.carteira
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para suportes_resistencias
DROP POLICY IF EXISTS "Todos podem ver suportes e resistências" ON public.suportes_resistencias;
CREATE POLICY "Todos podem ver suportes e resistências" ON public.suportes_resistencias
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Apenas admins podem inserir suportes e resistências" ON public.suportes_resistencias;
CREATE POLICY "Apenas admins podem inserir suportes e resistências" ON public.suportes_resistencias
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Apenas admins podem atualizar suportes e resistências" ON public.suportes_resistencias;
CREATE POLICY "Apenas admins podem atualizar suportes e resistências" ON public.suportes_resistencias
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Apenas admins podem deletar suportes e resistências" ON public.suportes_resistencias;
CREATE POLICY "Apenas admins podem deletar suportes e resistências" ON public.suportes_resistencias
  FOR DELETE USING (public.is_admin());

-- =====================================================
-- PERMISSÕES
-- =====================================================

-- Conceder permissões para usuários autenticados
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.carteira TO authenticated;
GRANT ALL ON public.suportes_resistencias TO authenticated;

-- Conceder permissões para executar funções
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE public.carteira IS 'Tabela para armazenar a carteira de investimentos dos usuários';
COMMENT ON TABLE public.suportes_resistencias IS 'Tabela para armazenar níveis de suporte e resistência dos ativos';
COMMENT ON FUNCTION public.is_admin() IS 'Verifica se o usuário atual é administrador';
COMMENT ON FUNCTION public.get_user_role(uuid) IS 'Obtém o cargo de um usuário';
COMMENT ON FUNCTION public.update_user_role(uuid, text) IS 'Atualiza o cargo de um usuário (apenas admins)';
COMMENT ON FUNCTION public.list_users() IS 'Lista todos os usuários (apenas admins)';
COMMENT ON FUNCTION public.handle_new_user() IS 'Define cargo padrão para novos usuários';
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Atualiza o timestamp de modificação';

-- =====================================================
-- SCRIPT PARA CONFIGURAR USUÁRIO COMO ADMIN
-- =====================================================

-- Para configurar um usuário como admin, execute:
-- UPDATE auth.users 
-- SET user_metadata = jsonb_set(
--   COALESCE(user_metadata, '{}'::jsonb),
--   '{role}',
--   '"admin"'
-- )
-- WHERE email = 'seu-email@exemplo.com';