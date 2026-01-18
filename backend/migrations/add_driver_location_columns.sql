-- ============================================
-- INSTRUÇÕES PARA EXECUTAR ESTA MIGRATION
-- ============================================
-- 
-- OPÇÃO 1: Via pgAdmin
-- 1. Abra o pgAdmin
-- 2. Conecte ao banco de dados 'umbora'
-- 3. Clique com botão direito no banco > Query Tool
-- 4. Cole este script completo
-- 5. Clique em Execute (F5)
--
-- OPÇÃO 2: Via linha de comando (se psql estiver no PATH)
-- psql -U postgres -d umbora -f add_driver_location_columns.sql
--
-- OPÇÃO 3: Via Node.js (execute o arquivo apply_migration.js)
-- node backend/migrations/apply_migration.js
--
-- ============================================

-- Migration: Adicionar colunas de localização e disponibilidade à tabela drivers
-- Data: 2026-01-18
-- Descrição: Adiciona colunas necessárias para rastreamento de localização em tempo real

BEGIN;

-- Adicionar coluna de latitude atual
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS current_latitude DECIMAL(10, 8);

-- Adicionar coluna de longitude atual
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS current_longitude DECIMAL(11, 8);

-- Adicionar coluna de disponibilidade (se o motorista está online e aceitando corridas)
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT false;

-- Adicionar coluna de avaliação média
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 0.00;

-- Adicionar índice para melhorar performance de buscas por localização
CREATE INDEX IF NOT EXISTS idx_drivers_location 
ON drivers(current_latitude, current_longitude) 
WHERE is_available = true;

COMMIT;

-- Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'drivers'
ORDER BY ordinal_position;
