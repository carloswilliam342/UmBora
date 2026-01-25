// Script para aplicar migration da tabela passengers
import { pool } from '../db.js';

async function createPassengersTable() {
    const client = await pool.connect();

    try {
        console.log('🔄 Criando tabela passengers...');

        await client.query('BEGIN');

        // Criar tabela de passageiros
        await client.query(`
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
      )
    `);
        console.log('✅ Tabela passengers criada');

        // Criar índice
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_passengers_user ON passengers(user_id)
    `);
        console.log('✅ Índice idx_passengers_user criado');

        await client.query('COMMIT');

        console.log('\n✅ Migration aplicada com sucesso!');
        console.log('\n📋 Verificando estrutura da tabela passengers...');

        const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'passengers'
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

createPassengersTable()
    .then(() => {
        console.log('\n✅ Processo concluído!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Falha na migration:', error);
        process.exit(1);
    });
