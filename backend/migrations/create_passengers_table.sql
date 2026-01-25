-- ============================================
-- Migration: Criar tabela de passageiros
-- Data: 2026-01-25
-- Descrição: Tabela para armazenar dados de passageiros
-- ============================================

BEGIN;

-- Criar tabela de passageiros (se não existir)
CREATE TABLE IF NOT EXISTS passengers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    cpf VARCHAR(14) UNIQUE,
    cep VARCHAR(10),
    endereco_rua TEXT,
    endereco_bairro TEXT,
    endereco_numero VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_passengers_user ON passengers(user_id);

COMMIT;

-- Verificar
SELECT table_name FROM information_schema.tables WHERE table_name = 'passengers';
