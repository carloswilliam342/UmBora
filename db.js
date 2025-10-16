import pkg from 'pg';
const { Pool }  = pkg;

export const pool  = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'umbora_db',
    password: '280304',
    port: 5432,
});