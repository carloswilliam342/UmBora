// Script para aplicar migration da tabela ride_passengers
import { pool } from '../db.js';

async function createRidePassengersTable() {
    const client = await pool.connect();

    try {
        console.log('🔄 Criando tabela ride_passengers...');

        await client.query('BEGIN');

        // Criar tabela de passageiros por carona
        await client.query(`
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
      )
    `);
        console.log('✅ Tabela ride_passengers criada');

        // Criar índices
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ride_passengers_ride ON ride_passengers(ride_id)
    `);
        console.log('✅ Índice idx_ride_passengers_ride criado');

        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ride_passengers_passenger ON ride_passengers(passenger_id)
    `);
        console.log('✅ Índice idx_ride_passengers_passenger criado');

        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ride_passengers_status ON ride_passengers(status)
    `);
        console.log('✅ Índice idx_ride_passengers_status criado');

        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ride_passengers_pending ON ride_passengers(ride_id, status) 
      WHERE status = 'pending'
    `);
        console.log('✅ Índice idx_ride_passengers_pending criado');

        // Adicionar comentários
        await client.query(`
      COMMENT ON TABLE ride_passengers IS 'Solicitações de vagas em caronas'
    `);
        await client.query(`
      COMMENT ON COLUMN ride_passengers.status IS 'Status: pending, confirmed, rejected, cancelled'
    `);
        console.log('✅ Comentários adicionados');

        await client.query('COMMIT');

        console.log('\n✅ Migration aplicada com sucesso!');
        console.log('\n📋 Verificando estrutura da tabela ride_passengers...');

        const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'ride_passengers'
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

createRidePassengersTable()
    .then(() => {
        console.log('\n✅ Processo concluído!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Falha na migration:', error);
        process.exit(1);
    });
