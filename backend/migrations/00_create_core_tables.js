// Script para criar as tabelas core (users, drivers, vehicles)
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar dotenv para carregar o .env do diretório backend ANTES de importar db.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const { pool } = await import('../db.js');

async function createCoreTables() {
  const client = await pool.connect();

  try {
    console.log('🔄 Criando tabelas base (users, drivers, vehicles)...');
    await client.query('BEGIN');

    // Tabela de users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela users criada');

    // Tabela de drivers
    await client.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        cnh VARCHAR(20) UNIQUE NOT NULL,
        current_latitude DECIMAL(10, 8),
        current_longitude DECIMAL(11, 8),
        is_available BOOLEAN DEFAULT false,
        rating DECIMAL(3, 2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabela drivers criada');

    // Tabela de vehicles
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        driver_id INTEGER NOT NULL UNIQUE,
        modelo VARCHAR(255) NOT NULL,
        placa VARCHAR(20) UNIQUE NOT NULL,
        cor VARCHAR(50) NOT NULL,
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabela vehicles criada');

    await client.query('COMMIT');
    console.log('\n✅ Migration aplicada com sucesso!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao aplicar migration das tabelas base:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createCoreTables()
  .then(() => {
    console.log('\n✅ Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Falha na migration:', error);
    process.exit(1);
  });
