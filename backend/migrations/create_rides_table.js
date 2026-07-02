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

async function createRidesTable() {
  const client = await pool.connect();

  try {
    console.log('🔄 Criando tabela rides...');

    await client.query('BEGIN');

    // Criar tabela de caronas
    await client.query(`
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
        status VARCHAR(50) DEFAULT 'available',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Constraints
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
        CHECK (available_seats > 0),
        CHECK (available_seats <= 8),
        CHECK (price_per_seat >= 0)
      )
    `);
    console.log('✅ Tabela rides criada');

    const indexes = [
      {
        sql: `CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id)`,
        label: 'idx_rides_driver',
      },
      {
        sql: `CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status)`,
        label: 'idx_rides_status',
      },
      {
        sql: `CREATE INDEX IF NOT EXISTS idx_rides_departure ON rides(departure_time)`,
        label: 'idx_rides_departure',
      },
      {
        sql: `CREATE INDEX IF NOT EXISTS idx_rides_origin_location ON rides(origin_latitude, origin_longitude)`,
        label: 'idx_rides_origin_location',
      },
      {
        sql: `CREATE INDEX IF NOT EXISTS idx_rides_destination_location ON rides(destination_latitude, destination_longitude)`,
        label: 'idx_rides_destination_location',
      },
      {
        sql: `CREATE INDEX IF NOT EXISTS idx_rides_available ON rides(status, departure_time) WHERE status = 'available'`,
        label: 'idx_rides_available',
      },
    ];

    for (const { sql, label } of indexes) {
      await client.query(sql);
      console.log(`✅ Índice ${label} criado`);
    }

    await client.query('COMMIT');

    console.log('\n✅ Migration aplicada com sucesso!');
    console.log('\n📋 Verificando estrutura da tabela rides...');

    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'rides'
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

try {
  await createRidesTable();
  console.log('\n✅ Processo concluído!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Falha na migration:', error);
  process.exit(1);
}
