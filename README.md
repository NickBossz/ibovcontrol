# IBOV Control - Sistema de Monitoramento e Gestão de Investimentos

## 📌 Sobre o Projeto

O IBOV Control é uma plataforma web completa para acompanhamento e gestão de investimentos na bolsa de valores brasileira. O sistema permite monitorar ativos em tempo real, gerenciar carteiras de investimentos, visualizar análises técnicas com suportes e resistências, e acompanhar operações detalhadas.

## 🎯 Funcionalidades Principais

### 📊 Dashboard da Bolsa (/dashboard)
- **Resumo do Mercado**: Estatísticas em tempo real (total de ativos, média de variação, ativos em alta/baixa)
- **Visualização Flexível**: Alterne entre visualização em tabela ou cards
- **Análise Técnica**: Indicadores de suportes e resistências com status visual (Forte Suporte, Suporte, Neutro, Resistência, Forte Resistência)
- **Busca Avançada**: Filtros por código, nome, variação e volume
- **Ordenação Inteligente**: Ordene por qualquer critério (preço, variação, volume, etc.)
- **Atualização em Tempo Real**: Dados sincronizados com Google Sheets

### 💼 Gestão de Carteira (/carteira)
- **Carteira Personalizada**: Acompanhe seus ativos com preço médio e quantidade
- **Registro de Operações**: Histórico completo de compras e vendas com observações
- **Análise de Performance**:
  - Cálculo automático de lucro/prejuízo em R$ e %
  - Valor total investido vs. valor atual
  - Retorno total da carteira
- **Indicadores Visuais**: Status de cada ativo em relação aos suportes e resistências
- **Gestão Completa**: Adicione, edite, remova ativos e registre operações

### 🛠️ Painel Administrativo (/admin)
- **Gerenciamento de Usuários**: Visualize e altere perfis de acesso
- **Configuração de Análise Técnica**:
  - Defina 3 níveis de suporte e 3 de resistência para cada ativo
  - Adicione observações e justificativas para cada nível
  - Controle de quem modificou e quando
- **Interface Intuitiva**: Edição inline dos valores técnicos
- **Controle de Acesso**: Restrito apenas a administradores

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

- **Frontend**: React 18 + TypeScript + Vite 5
- **UI Components**: shadcn/ui (Radix UI) + Tailwind CSS
- **Gráficos**: ApexCharts + Recharts
- **Backend**: Supabase (autenticação, banco de dados PostgreSQL, RLS)
- **Estado Global**: React Query (TanStack Query v5)
- **Roteamento**: React Router DOM v6
- **Fonte de Dados**: Google Sheets API (integração em tempo real)
- **Validação**: Zod + React Hook Form
- **Formatação de Datas**: date-fns

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

## 📱 Funcionalidades Implementadas

### Dashboard da Bolsa ✅
- ✅ Exibição de todos os ativos sincronizados do Google Sheets
- ✅ Cards de estatísticas em tempo real (total de ativos, média de variação, ativos em alta/baixa)
- ✅ Duas visualizações: tabela completa e cards visuais
- ✅ Sistema de análise técnica com suportes e resistências
- ✅ Indicadores visuais de status (Forte Suporte → Forte Resistência)
- ✅ Busca inteligente por código ou nome
- ✅ Ordenação múltipla (sigla, preço, variação, volume)
- ✅ Layout totalmente responsivo
- ✅ Atualização manual sob demanda
- ✅ Formatação brasileira de valores (R$, %, volume)

### Minha Carteira ✅
- ✅ Sistema de autenticação completo via Supabase
- ✅ Adicionar múltiplos ativos com quantidade e preço médio
- ✅ Histórico completo de operações (compra/venda)
- ✅ Campo de observações para cada operação
- ✅ Cálculo automático de rentabilidade por ativo e total
- ✅ Cards visuais com status técnico de cada ativo
- ✅ Resumo financeiro detalhado (investido, atual, lucro/prejuízo)
- ✅ Gestão completa: adicionar, editar, remover ativos e operações
- ✅ Integração em tempo real com preços atualizados
- ✅ Visualização de suportes e resistências na carteira

### Painel Administrativo ✅
- ✅ Autenticação com controle de acesso por perfil (apenas admins)
- ✅ Gerenciamento completo de usuários
- ✅ Alteração de perfis de acesso (cliente/admin)
- ✅ Configuração de análise técnica para cada ativo:
  - 3 níveis de suporte
  - 3 níveis de resistência
  - Campo de observações/motivo para cada nível
- ✅ Edição inline dos valores técnicos
- ✅ Sistema de auditoria (usuário e data de modificação)
- ✅ Interface administrativa intuitiva e profissional

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

## 🎨 Destaques da Interface

- **Design Moderno**: Interface clean e profissional com shadcn/ui
- **Dark Mode**: Suporte completo a tema escuro (em desenvolvimento)
- **Responsividade**: Funciona perfeitamente em mobile, tablet e desktop
- **Feedback Visual**: Toasts, badges coloridos e indicadores de status
- **Performance**: Carregamento otimizado com React Query e cache inteligente
- **Acessibilidade**: Componentes acessíveis com Radix UI

## 🔄 Roadmap - Próximas Funcionalidades

- [ ] Gráficos interativos de candlestick para análise histórica
- [ ] Sistema de alertas de preço por email/notificação
- [ ] Dashboard com gráficos de performance da carteira
- [ ] Análise técnica automática (médias móveis, RSI, MACD)
- [ ] Exportação de relatórios em PDF/Excel
- [ ] Sistema de notificações push
- [ ] Integração com B3 e outras fontes de dados
- [ ] Modo escuro (dark mode)
- [ ] App mobile com React Native
- [ ] API pública para desenvolvedores

---

**Desenvolvido com ❤️ para a comunidade de investidores brasileiros**
