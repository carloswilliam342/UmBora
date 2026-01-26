// Script para adicionar colunas de detalhes do passageiro à tabela ride_passengers
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar dotenv para carregar o .env do diretório backend ANTES de importar db.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Agora importar o pool DEPOIS de configurar o dotenv
const { pool } = await import('../db.js');

async function addPassengerDetailsColumns() {
    const client = await pool.connect();

    try {
        console.log('🔄 Adicionando colunas de detalhes do passageiro à tabela ride_passengers...');

        await client.query('BEGIN');

        // Verificar se as colunas já existem
        const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ride_passengers' 
      AND column_name IN ('number_of_passengers', 'payment_method')
    `);

        if (checkColumns.rows.length > 0) {
            console.log('⚠️  Colunas já existem. Pulando migration...');
            await client.query('COMMIT');
            return;
        }

        // Adicionar coluna number_of_passengers
        await client.query(`
      ALTER TABLE ride_passengers
      ADD COLUMN number_of_passengers INTEGER NOT NULL DEFAULT 1
    `);
        console.log('✅ Coluna number_of_passengers adicionada');

        // Adicionar coluna payment_method
        await client.query(`
      ALTER TABLE ride_passengers
      ADD COLUMN payment_method VARCHAR(20)
    `);
        console.log('✅ Coluna payment_method adicionada');

        // Adicionar constraint para validar number_of_passengers
        await client.query(`
      ALTER TABLE ride_passengers
      ADD CONSTRAINT check_number_of_passengers_positive 
      CHECK (number_of_passengers > 0)
    `);
        console.log('✅ Constraint check_number_of_passengers_positive adicionada');

        // Adicionar constraint para validar payment_method
        await client.query(`
      ALTER TABLE ride_passengers
      ADD CONSTRAINT check_payment_method_valid 
      CHECK (payment_method IN ('cash', 'pix', 'card'))
    `);
        console.log('✅ Constraint check_payment_method_valid adicionada');

        // Adicionar comentários
        await client.query(`
      COMMENT ON COLUMN ride_passengers.number_of_passengers IS 'Quantidade de pessoas que irão viajar'
    `);
        await client.query(`
      COMMENT ON COLUMN ride_passengers.payment_method IS 'Forma de pagamento: cash, pix, card'
    `);
        console.log('✅ Comentários adicionados');

        await client.query('COMMIT');

        console.log('\n✅ Migration aplicada com sucesso!');
        console.log('\n📋 Verificando estrutura atualizada da tabela ride_passengers...');

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

addPassengerDetailsColumns()
    .then(() => {
        console.log('\n✅ Processo concluído!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Falha na migration:', error);
        process.exit(1);
    });
