-- Criar tabela para registrar todas as operações de entrada e saída
CREATE TABLE public.carteira_operacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ativo_codigo text NOT NULL,
    tipo_operacao text NOT NULL CHECK (tipo_operacao IN ('entrada', 'saida')),
    quantidade integer NOT NULL CHECK (quantidade > 0),
    preco numeric(10,2) NOT NULL CHECK (preco > 0),
    data_operacao date NOT NULL,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX idx_carteira_operacoes_user_id ON public.carteira_operacoes(user_id);
CREATE INDEX idx_carteira_operacoes_ativo ON public.carteira_operacoes(user_id, ativo_codigo);
CREATE INDEX idx_carteira_operacoes_data ON public.carteira_operacoes(data_operacao);

-- Habilitar RLS
ALTER TABLE public.carteira_operacoes ENABLE ROW LEVEL SECURITY;

-- Política para que usuários só vejam suas próprias operações
CREATE POLICY "Users can view own operations" ON public.carteira_operacoes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own operations" ON public.carteira_operacoes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own operations" ON public.carteira_operacoes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own operations" ON public.carteira_operacoes
    FOR DELETE USING (auth.uid() = user_id);

-- Função para calcular preço médio e quantidade total baseado nas operações
CREATE OR REPLACE FUNCTION public.calcular_posicao_ativo(p_user_id uuid, p_ativo_codigo text)
RETURNS TABLE(
    quantidade_total integer,
    preco_medio numeric(10,2),
    valor_investido numeric(10,2)
) AS $$
DECLARE
    total_entrada integer := 0;
    total_saida integer := 0;
    valor_total_entrada numeric(10,2) := 0;
    valor_total_saida numeric(10,2) := 0;
    quantidade_final integer;
    preco_medio_final numeric(10,2);
BEGIN
    -- Somar entradas
    SELECT 
        COALESCE(SUM(o.quantidade), 0),
        COALESCE(SUM(o.quantidade * o.preco), 0)
    INTO total_entrada, valor_total_entrada
    FROM carteira_operacoes o
    WHERE o.user_id = p_user_id 
      AND o.ativo_codigo = p_ativo_codigo 
      AND o.tipo_operacao = 'entrada';
    
    -- Somar saídas
    SELECT 
        COALESCE(SUM(o.quantidade), 0),
        COALESCE(SUM(o.quantidade * o.preco), 0)
    INTO total_saida, valor_total_saida
    FROM carteira_operacoes o
    WHERE o.user_id = p_user_id 
      AND o.ativo_codigo = p_ativo_codigo 
      AND o.tipo_operacao = 'saida';
    
    -- Calcular posição final
    quantidade_final := total_entrada - total_saida;
    
    IF quantidade_final > 0 THEN
        -- Preço médio = (valor total das entradas - valor total das saídas) / quantidade final
        -- Simplificado: usar apenas valor das entradas para preço médio
        preco_medio_final := valor_total_entrada / total_entrada;
    ELSE
        preco_medio_final := 0;
        quantidade_final := 0;
    END IF;
    
    RETURN QUERY SELECT 
        quantidade_final,
        preco_medio_final,
        quantidade_final * preco_medio_final;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar automaticamente a tabela carteira baseado nas operações
CREATE OR REPLACE FUNCTION public.atualizar_carteira_from_operacoes()
RETURNS TRIGGER AS $$
DECLARE
    posicao RECORD;
    carteira_record RECORD;
BEGIN
    -- Calcular nova posição do ativo
    SELECT * INTO posicao 
    FROM calcular_posicao_ativo(
        COALESCE(NEW.user_id, OLD.user_id), 
        COALESCE(NEW.ativo_codigo, OLD.ativo_codigo)
    );
    
    -- Verificar se já existe registro na carteira
    SELECT * INTO carteira_record
    FROM carteira 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
      AND ativo_codigo = COALESCE(NEW.ativo_codigo, OLD.ativo_codigo);
    
    IF posicao.quantidade_total > 0 THEN
        -- Se tem posição, atualizar ou inserir na carteira
        IF FOUND THEN
            -- Atualizar registro existente
            UPDATE carteira SET
                quantidade = posicao.quantidade_total,
                preco_medio = posicao.preco_medio,
                updated_at = now()
            WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
              AND ativo_codigo = COALESCE(NEW.ativo_codigo, OLD.ativo_codigo);
        ELSE
            -- Inserir novo registro
            INSERT INTO carteira (user_id, ativo_codigo, quantidade, preco_medio, data_compra)
            VALUES (
                COALESCE(NEW.user_id, OLD.user_id),
                COALESCE(NEW.ativo_codigo, OLD.ativo_codigo),
                posicao.quantidade_total,
                posicao.preco_medio,
                COALESCE(NEW.data_operacao, OLD.data_operacao)
            );
        END IF;
    ELSE
        -- Se não tem posição, remover da carteira
        IF FOUND THEN
            DELETE FROM carteira 
            WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
              AND ativo_codigo = COALESCE(NEW.ativo_codigo, OLD.ativo_codigo);
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar carteira automaticamente após operações
CREATE TRIGGER trigger_atualizar_carteira
    AFTER INSERT OR UPDATE OR DELETE ON public.carteira_operacoes
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_carteira_from_operacoes();

-- Grant permissions
GRANT ALL ON public.carteira_operacoes TO authenticated;
GRANT EXECUTE ON FUNCTION public.calcular_posicao_ativo TO authenticated;