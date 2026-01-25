-- ============================================
-- Migration: Criar tabela de passageiros por carona
-- Data: 2026-01-25
-- Descrição: Tabela para gerenciar solicitações de vagas em caronas
-- ============================================

BEGIN;

-- Criar tabela de passageiros por carona
CREATE TABLE IF NOT EXISTS ride_passengers (
    id SERIAL PRIMARY KEY,
    ride_id INTEGER NOT NULL,
    passenger_id INTEGER NOT NULL,
    
    -- Status da solicitação
    status VARCHAR(20) DEFAULT 'pending',
    -- pending: aguardando resposta do motorista
    -- confirmed: vaga confirmada
    -- rejected: solicitação rejeitada
    -- cancelled: cancelada pelo passageiro
    
    -- Timestamps
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
    FOREIGN KEY (passenger_id) REFERENCES passengers(id) ON DELETE CASCADE,
    UNIQUE(ride_id, passenger_id) -- Um passageiro só pode solicitar uma vez por carona
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_ride_passengers_ride ON ride_passengers(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_passengers_passenger ON ride_passengers(passenger_id);
CREATE INDEX IF NOT EXISTS idx_ride_passengers_status ON ride_passengers(status);

-- Índice composto para buscar solicitações pendentes de uma carona
CREATE INDEX IF NOT EXISTS idx_ride_passengers_pending ON ride_passengers(ride_id, status) 
WHERE status = 'pending';

-- Comentários
COMMENT ON TABLE ride_passengers IS 'Solicitações de vagas em caronas';
COMMENT ON COLUMN ride_passengers.status IS 'Status: pending, confirmed, rejected, cancelled';

COMMIT;

-- Verificar se a tabela foi criada
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'ride_passengers'
ORDER BY ordinal_position;
