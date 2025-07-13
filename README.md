# IBOV Control - Sistema de Monitoramento da Bolsa

## 📌 Objetivo

O IBOV Control é um sistema web para exibir informações atualizadas sobre ativos da bolsa de valores brasileira, permitindo aos usuários acompanhar preços, variações, volume, valor de mercado e data/hora da última atualização. As informações são carregadas automaticamente de uma planilha do Google Sheets.

## 🎯 Funcionalidades Principais

### 📊 Dashboard da Bolsa (/dashboard)
- **Resumo do Mercado**: Total de ativos, média de variação, ativos em alta/baixa
- **Tabela de Ativos**: Código, nome, preço atual, variação, volume, valor de mercado
- **Busca e Filtros**: Buscar por nome/código, ordenar por diferentes critérios
- **Atualização Automática**: Botão para atualizar dados em tempo real

### 💼 Gestão de Carteira (/carteira)
- **Carteira Pessoal**: Registro de ativos comprados com quantidade e preço médio
- **Cálculo de Rentabilidade**: Lucro/prejuízo em R$ e % baseado nos preços atuais
- **Resumo da Carteira**: Valor total investido, valor atual, retorno total
- **Gestão de Ativos**: Adicionar, editar e remover ativos da carteira

### 🛠️ Painel Administrativo (/admin)
- **Gerenciamento de Usuários**: Visualizar e alterar cargos dos usuários
- **Suportes e Resistências**: Configuração de níveis técnicos para cada ativo
- **Edição Inline**: Modificação direta dos valores na tabela
- **Controle de Acesso**: Apenas administradores podem acessar
- **Log de Modificações**: Registro de quem alterou e quando

## 📄 Estrutura da Planilha

A planilha do Google Sheets deve conter as seguintes colunas:

| Coluna | Descrição |
|--------|-----------|
| SIGLA | Código da ação (ex: PETR4) |
| REFERENCIA | Nome da empresa ou título (ex: Petrobras PN) |
| PRECO ATUAL | Valor atual da ação |
| VARIACAO | Diferença em relação ao dia anterior |
| VARIAÇÃO PERCENTUAL | Variação em % |
| VOLUME | Volume negociado no dia |
| VALOR MERCADO | Valor de mercado total |
| ULTIMA ATUALIZACAO | Data e hora da última atualização |

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (autenticação e banco de dados)
- **Estado**: React Query (TanStack Query)
- **Roteamento**: React Router DOM
- **Dados**: Google Sheets API

## 🚀 Configuração e Instalação

### Pré-requisitos
- Node.js 18+ e npm
- Conta no Supabase
- Planilha do Google Sheets configurada

### Passos de Instalação

1. **Clone o repositório**
```bash
git clone <URL_DO_REPOSITORIO>
cd ibovcontrol
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
# Supabase
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase

# Google Sheets (opcional)
VITE_GOOGLE_API_KEY=sua_chave_api_do_google
```

4. **Configure o Supabase**
- Crie um projeto no [Supabase](https://supabase.com)
- Execute o script SQL `supabase-setup.sql` no SQL Editor
- Configure as políticas de segurança (Row Level Security)

5. **Configure a Planilha do Google Sheets**
- Crie uma planilha com a estrutura especificada acima
- Torne a planilha pública ou configure uma API key
- Atualize o `SPREADSHEET_ID` no arquivo `src/services/googleSheets.ts`

6. **Execute o projeto**
```bash
npm run dev
```

## 🗄️ Estrutura do Banco de Dados

### Sistema de Cargos
O sistema utiliza o campo `raw_user_meta_data` da tabela `auth.users` do Supabase para armazenar o cargo do usuário:
- **cliente**: Usuário padrão com acesso às funcionalidades básicas
- **admin**: Administrador com acesso ao painel administrativo

### Tabela `carteira`
```sql
CREATE TABLE carteira (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ativo_codigo TEXT NOT NULL,
  quantidade DECIMAL(10,2) NOT NULL,
  preco_medio DECIMAL(10,2) NOT NULL,
  data_compra DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Políticas de Segurança
- Cada usuário só pode ver e modificar seus próprios dados
- Autenticação obrigatória para todas as operações
- Triggers automáticos para timestamps

## 🔧 Configuração da Planilha

### Método 1: Planilha Pública
1. Crie a planilha no Google Sheets
2. Clique em "Compartilhar" → "Qualquer pessoa com o link pode visualizar"
3. Copie o ID da planilha da URL
4. O sistema usará o método público para buscar os dados

### Método 2: API Key (Recomendado)
1. Crie um projeto no Google Cloud Console
2. Ative a Google Sheets API
3. Crie uma API Key
4. Adicione a chave no arquivo `.env`
5. O sistema usará a API oficial para buscar os dados

## 📱 Funcionalidades por Página

### Dashboard da Bolsa
- ✅ Exibição de todos os ativos da planilha
- ✅ Estatísticas do mercado (total, alta/baixa, média)
- ✅ Busca e filtros por sigla/nome
- ✅ Ordenação por diferentes critérios
- ✅ Layout responsivo (mobile/desktop)
- ✅ Atualização manual dos dados
- ✅ Formatação de valores (moeda, volume, percentual)

### Minha Carteira
- ✅ Autenticação obrigatória
- ✅ Adicionar ativos com quantidade e preço médio
- ✅ Cálculo automático de rentabilidade
- ✅ Resumo financeiro da carteira
- ✅ Edição e remoção de ativos
- ✅ Integração com dados atualizados da bolsa

### Painel Administrativo
- ✅ Controle de acesso (apenas admins)
- ✅ Gerenciamento de usuários e cargos
- ✅ Gestão de suportes e resistências
- ✅ Edição inline dos valores
- ✅ Log de modificações
- ✅ Interface intuitiva para administradores

## 🔒 Segurança

- **Autenticação**: Supabase Auth com email/senha
- **Autorização**: Row Level Security no banco de dados
- **Validação**: Validação de dados no frontend e backend
- **HTTPS**: Todas as comunicações são criptografadas
- **Rate Limiting**: Proteção contra abuso da API

## 🚀 Deploy

### Deploy no Lovable
1. Acesse [Lovable](https://lovable.dev)
2. Conecte seu repositório
3. Configure as variáveis de ambiente
4. Clique em "Publish"

### Deploy Manual
```bash
npm run build
# Faça upload dos arquivos da pasta dist/ para seu servidor
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação do Supabase
2. Consulte os logs do console do navegador
3. Verifique se a planilha está acessível
4. Confirme se as variáveis de ambiente estão corretas

## 🔄 Atualizações Futuras

- [ ] Gráficos interativos (candlestick, linha)
- [ ] Alertas de preço
- [ ] Análise técnica automática
- [ ] Exportação de relatórios
- [ ] Notificações push
- [ ] Integração com mais fontes de dados
- [ ] App mobile (React Native)

---

**Desenvolvido com ❤️ para a comunidade de investidores brasileiros**
