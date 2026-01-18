// Script para verificar e atualizar motoristas no banco de dados
import { pool } from '../db.js';

async function checkAndUpdateDrivers() {
    const client = await pool.connect();

    try {
        console.log('🔍 Verificando motoristas cadastrados...\n');

        // 1. Listar todos os motoristas
        const driversResult = await client.query(`
      SELECT 
        d.id,
        u.name,
        u.email,
        d.cnh,
        d.current_latitude,
        d.current_longitude,
        d.is_available,
        d.rating,
        d.status,
        v.modelo as vehicle_model,
        v.placa as vehicle_plate,
        v.cor as vehicle_color
      FROM drivers d
      INNER JOIN users u ON d.user_id = u.id
      LEFT JOIN vehicles v ON v.driver_id = d.id
      ORDER BY d.id
    `);

        if (driversResult.rows.length === 0) {
            console.log('❌ Nenhum motorista encontrado no banco de dados.');
            console.log('\n💡 Cadastre um motorista primeiro através do app ou execute:');
            console.log('   INSERT INTO users (name, email, password_hash) VALUES (\'João Silva\', \'joao@example.com\', \'hash\');');
            console.log('   INSERT INTO drivers (user_id, cnh) VALUES (1, \'12345678901\');');
            console.log('   INSERT INTO vehicles (driver_id, modelo, placa, cor) VALUES (1, \'Honda Civic\', \'ABC-1234\', \'Prata\');\n');
            return;
        }

        console.log(`✅ Encontrados ${driversResult.rows.length} motorista(s):\n`);
        console.table(driversResult.rows.map(d => ({
            ID: d.id,
            Nome: d.name,
            Email: d.email,
            Veículo: d.vehicle_model || 'N/A',
            Placa: d.vehicle_plate || 'N/A',
            Latitude: d.current_latitude || 'Não definida',
            Longitude: d.current_longitude || 'Não definida',
            Disponível: d.is_available ? 'Sim' : 'Não',
            Avaliação: d.rating || 0,
            Status: d.status
        })));

        // 2. Verificar quais motoristas NÃO têm localização
        const driversWithoutLocation = driversResult.rows.filter(d => !d.current_latitude || !d.current_longitude);

        if (driversWithoutLocation.length > 0) {
            console.log(`\n⚠️  ${driversWithoutLocation.length} motorista(s) sem localização definida:\n`);
            driversWithoutLocation.forEach(d => {
                console.log(`   - ID ${d.id}: ${d.name} (${d.email})`);
            });

            console.log('\n📍 Para adicionar localização a um motorista, execute:');
            console.log(`   UPDATE drivers SET current_latitude = -23.5505, current_longitude = -46.6333, is_available = true WHERE id = ${driversWithoutLocation[0].id};\n`);

            // Perguntar se quer atualizar automaticamente
            console.log('💡 Quer atualizar automaticamente? Edite este script e descomente a seção de UPDATE abaixo.\n');

            /*
            // DESCOMENTE ESTA SEÇÃO PARA ATUALIZAR AUTOMATICAMENTE
            // Substitua as coordenadas pela sua localização atual
            const driverId = driversWithoutLocation[0].id;
            const latitude = -23.5505;  // São Paulo - substitua pela sua localização
            const longitude = -46.6333; // São Paulo - substitua pela sua localização
            
            await client.query(`
              UPDATE drivers 
              SET 
                current_latitude = $1,
                current_longitude = $2,
                is_available = true,
                rating = 4.8
              WHERE id = $3
            `, [latitude, longitude, driverId]);
            
            console.log(`✅ Motorista ID ${driverId} atualizado com sucesso!`);
            */
        }

        // 3. Verificar quais motoristas estão disponíveis
        const availableDrivers = driversResult.rows.filter(d => d.is_available && d.current_latitude && d.current_longitude);

        if (availableDrivers.length > 0) {
            console.log(`\n✅ ${availableDrivers.length} motorista(s) disponível(is) no mapa:\n`);
            availableDrivers.forEach(d => {
                console.log(`   - ${d.name} (${d.vehicle_model} ${d.vehicle_color}) - Lat: ${d.current_latitude}, Lng: ${d.current_longitude}`);
            });
        } else {
            console.log('\n⚠️  Nenhum motorista disponível no mapa.');
            console.log('   Para um motorista aparecer no mapa, ele precisa ter:');
            console.log('   - current_latitude definida');
            console.log('   - current_longitude definida');
            console.log('   - is_available = true\n');
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkAndUpdateDrivers()
    .then(() => {
        console.log('\n✅ Verificação concluída!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erro:', error);
        process.exit(1);
    });
