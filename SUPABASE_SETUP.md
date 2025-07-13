# Configuração do Supabase

Este projeto foi configurado com Supabase para autenticação e banco de dados. Siga os passos abaixo para configurar:

## 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Crie um novo projeto
4. Aguarde a configuração inicial

## 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
VITE_SUPABASE_URL=sua_url_do_supabase_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase_aqui
```

Para encontrar essas informações:
1. No dashboard do Supabase, vá em **Settings** > **API**
2. Copie a **Project URL** para `VITE_SUPABASE_URL`
3. Copie a **anon public** key para `VITE_SUPABASE_ANON_KEY`

## 3. Configurar autenticação

1. No dashboard do Supabase, vá em **Authentication** > **Settings**
2. Configure as URLs de redirecionamento:
   - **Site URL**: `http://localhost:5173` (para desenvolvimento)
   - **Redirect URLs**: `http://localhost:5173/**`

## 4. Criar tabela de perfis (opcional)

Execute o seguinte SQL no **SQL Editor** do Supabase:

```sql
-- Criar tabela de perfis
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seus próprios dados
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Política para usuários editarem apenas seus próprios dados
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Política para usuários inserirem seus próprios dados
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Função para criar perfil automaticamente após registro
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

## 5. Usar no projeto

### Autenticação

```tsx
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, signIn, signUp, signOut } = useAuth()
  
  // Usar as funções de autenticação
}
```

### Operações no banco

```tsx
import { useProfiles, useCreateProfile } from '@/hooks/useSupabase'

function MyComponent() {
  const { data: profiles, isLoading } = useProfiles()
  const createProfile = useCreateProfile()
  
  // Usar as funções do banco
}
```

## 6. Componente de exemplo

O projeto inclui um componente `AuthExample` que demonstra como usar a autenticação. Para testá-lo, importe e use no seu componente principal:

```tsx
import { AuthExample } from '@/components/AuthExample'

// Use o componente onde desejar
<AuthExample />
```

## 7. Próximos passos

- Configure políticas de segurança mais específicas no Supabase
- Adicione mais tabelas conforme necessário
- Configure storage para upload de arquivos
- Configure funções edge para lógica de backend
- Configure webhooks para integrações externas

## Recursos úteis

- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de autenticação](https://supabase.com/docs/guides/auth)
- [Guia de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [CLI do Supabase](https://supabase.com/docs/guides/cli) 