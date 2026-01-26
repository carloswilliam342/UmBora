// Script para aplicar migration da tabela passengers
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar dotenv para carregar o .env do diretório backend ANTES de importar db.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Agora importar o pool DEPOIS de configurar o dotenv
const { pool } = await import('../db.js');

async function applyMigration() {
  const client = await pool.connect();

  try {
    console.log('🔄 Iniciando migration: add_driver_location_columns...');

    await client.query('BEGIN');

    // Adicionar coluna de latitude atual
    await client.query(`
      ALTER TABLE drivers 
      ADD COLUMN IF NOT EXISTS current_latitude DECIMAL(10, 8)
    `);
    console.log('✅ Coluna current_latitude adicionada');

    // Adicionar coluna de longitude atual
    await client.query(`
      ALTER TABLE drivers 
      ADD COLUMN IF NOT EXISTS current_longitude DECIMAL(11, 8)
    `);
    console.log('✅ Coluna current_longitude adicionada');

    // Adicionar coluna de disponibilidade
    await client.query(`
      ALTER TABLE drivers 
      ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT false
    `);
    console.log('✅ Coluna is_available adicionada');

    // Adicionar coluna de avaliação
    await client.query(`
      ALTER TABLE drivers 
      ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 0.00
    `);
    console.log('✅ Coluna rating adicionada');

    // Adicionar índice
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_drivers_location 
      ON drivers(current_latitude, current_longitude) 
      WHERE is_available = true
    `);
    console.log('✅ Índice idx_drivers_location criado');

    await client.query('COMMIT');

    console.log('\n✅ Migration aplicada com sucesso!');
    console.log('\n📋 Verificando estrutura da tabela drivers...');

    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'drivers'
      ORDER BY ordinal_position
    `);

    console.table(result.rows);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao aplicar migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration()
  .then(() => {
    console.log('\n✅ Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Falha na migration:', error);
    process.exit(1);
  });
