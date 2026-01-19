-- ============================================
-- Migration: Criar tabela de caronas (rides)
-- Data: 2026-01-18
-- Descrição: Tabela para armazenar caronas cadastradas por motoristas
-- ============================================

BEGIN;

-- Criar tabela de caronas
CREATE TABLE IF NOT EXISTS rides (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL,
    
    -- Origem
    origin_address TEXT NOT NULL,
    origin_latitude DECIMAL(10, 8) NOT NULL,
    origin_longitude DECIMAL(11, 8) NOT NULL,
    
    -- Destino
    destination_address TEXT NOT NULL,
    destination_latitude DECIMAL(10, 8) NOT NULL,
    destination_longitude DECIMAL(11, 8) NOT NULL,
    
    -- Informações da carona
    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
    available_seats INTEGER NOT NULL,
    price_per_seat DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Status e metadados
    status VARCHAR(50) DEFAULT 'available', -- available, in_progress, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
    CHECK (available_seats > 0),
    CHECK (available_seats <= 8),
    CHECK (price_per_seat >= 0)
);

-- Índices para otimização de buscas
CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_departure ON rides(departure_time);
CREATE INDEX IF NOT EXISTS idx_rides_origin_location ON rides(origin_latitude, origin_longitude);
CREATE INDEX IF NOT EXISTS idx_rides_destination_location ON rides(destination_latitude, destination_longitude);

-- Índice composto para buscar caronas disponíveis
CREATE INDEX IF NOT EXISTS idx_rides_available ON rides(status, departure_time) WHERE status = 'available';

-- Comentários nas colunas
COMMENT ON TABLE rides IS 'Caronas cadastradas por motoristas';
COMMENT ON COLUMN rides.driver_id IS 'ID do motorista que oferece a carona';
COMMENT ON COLUMN rides.origin_address IS 'Endereço de origem da carona';
COMMENT ON COLUMN rides.destination_address IS 'Endereço de destino da carona';
COMMENT ON COLUMN rides.departure_time IS 'Data e hora de partida da carona';
COMMENT ON COLUMN rides.available_seats IS 'Número de vagas disponíveis (1-8)';
COMMENT ON COLUMN rides.price_per_seat IS 'Preço por vaga em reais (0 = gratuito)';
COMMENT ON COLUMN rides.status IS 'Status da carona: available, in_progress, completed, cancelled';

COMMIT;

-- Verificar se a tabela foi criada
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'rides'
ORDER BY ordinal_position;
