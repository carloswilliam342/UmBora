import express from 'express';
import { pool } from '../db.js';
import bcrypt from 'bcrypt';

const router = express.Router();
const saltRounds = 10;

// ROTA: GET /api/users/:userId
// Buscar dados do usuário por ID
export const getUserHandler = async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query(
            'SELECT id, name, email, phone FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Usuário não encontrado.'
            });
        }

        const user = result.rows[0];

        res.status(200).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone
            }
        });

    } catch (err) {
        console.error('Erro ao buscar usuário:', err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// Helper: valida os campos recebidos e retorna mensagem de erro ou null
function validateUserInput({ email, phone, password }) {
    const emailRegex = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        return 'Formato de e-mail inválido.';
    }

    const phoneRegex = /^\d{10,11}$/;
    if (phone && !phoneRegex.test(phone.replaceAll(/\D/g, ''))) {
        return 'Formato de telefone inválido. Use apenas números (10-11 dígitos).';
    }

    if (password && password.length < 6) {
        return 'A senha deve ter no mínimo 6 caracteres.';
    }

    return null;
}

// Helper: monta os campos e valores para o UPDATE dinamicamente
async function buildUpdateQuery({ name, email, phone, password }) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined && name.trim() !== '') {
        fields.push(`name = $${paramIndex++}`);
        values.push(name.trim());
    }

    if (email !== undefined) {
        fields.push(`email = $${paramIndex++}`);
        values.push(email.toLowerCase());
    }

    if (phone !== undefined) {
        fields.push(`phone = $${paramIndex++}`);
        values.push(phone.replaceAll(/\D/g, ''));
    }

    if (password !== undefined && password.trim() !== '') {
        const passwordHash = await bcrypt.hash(password, saltRounds);
        fields.push(`password_hash = $${paramIndex++}`);
        values.push(passwordHash);
    }

    return { fields, values, paramIndex };
}

// ROTA: PUT /api/users/:userId
// Atualizar dados do usuário
export const updateUserHandler = async (req, res) => {
    const { userId } = req.params;
    const { name, email, phone, password } = req.body;

    const validationError = validateUserInput({ email, phone, password });
    if (validationError) {
        return res.status(400).json({ message: validationError });
    }

    try {
        // 1. Verificar se o usuário existe
        const userCheck = await pool.query(
            'SELECT id FROM users WHERE id = $1',
            [userId]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // 2. Construir query de atualização dinamicamente
        const { fields, values, paramIndex } = await buildUpdateQuery({ name, email, phone, password });

        if (fields.length === 0) {
            return res.status(400).json({
                message: 'Nenhum campo válido fornecido para atualização.'
            });
        }

        // 3. Executar atualização
        values.push(userId);
        await pool.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
            values
        );

        // 4. Buscar dados atualizados
        const updatedUser = await pool.query(
            'SELECT id, name, email, phone FROM users WHERE id = $1',
            [userId]
        );

        res.status(200).json({
            message: 'Dados atualizados com sucesso!',
            user: updatedUser.rows[0]
        });

    } catch (err) {
        if (err.code === '23505' && err.constraint?.includes('email')) {
            return res.status(409).json({
                message: 'Este e-mail já está em uso por outro usuário.'
            });
        }

        console.error('Erro ao atualizar usuário:', err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

router.get('/:userId', getUserHandler);
router.put('/:userId', updateUserHandler);

export default router;
