-- Função para listar todos os usuários (apenas admins podem usar)
CREATE OR REPLACE FUNCTION list_users()
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
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem listar usuários';
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
END;
$$;

-- Política para permitir que admins executem a função
GRANT EXECUTE ON FUNCTION list_users() TO authenticated;

-- Comentário sobre a função
COMMENT ON FUNCTION list_users() IS 'Lista todos os usuários do sistema. Apenas administradores podem executar.'; 