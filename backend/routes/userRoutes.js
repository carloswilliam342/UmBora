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

// ROTA: PUT /api/users/:userId
// Atualizar dados do usuário
export const updateUserHandler = async (req, res) => {
    const { userId } = req.params;
    const { name, email, phone, password } = req.body;

    // Validação de email (formato básico)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        return res.status(400).json({ message: 'Formato de e-mail inválido.' });
    }

    // Validação de telefone (apenas números, 10-11 dígitos)
    const phoneRegex = /^\d{10,11}$/;
    if (phone && !phoneRegex.test(phone.replace(/\D/g, ''))) {
        return res.status(400).json({
            message: 'Formato de telefone inválido. Use apenas números (10-11 dígitos).'
        });
    }

    // Validação de senha (mínimo 6 caracteres)
    if (password && password.length < 6) {
        return res.status(400).json({
            message: 'A senha deve ter no mínimo 6 caracteres.'
        });
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
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (name !== undefined && name.trim() !== '') {
            updateFields.push(`name = $${paramIndex++}`);
            updateValues.push(name.trim());
        }

        if (email !== undefined) {
            updateFields.push(`email = $${paramIndex++}`);
            updateValues.push(email.toLowerCase());
        }

        if (phone !== undefined) {
            updateFields.push(`phone = $${paramIndex++}`);
            updateValues.push(phone.replace(/\D/g, '')); // Remove caracteres não numéricos
        }

        if (password !== undefined && password.trim() !== '') {
            const passwordHash = await bcrypt.hash(password, saltRounds);
            updateFields.push(`password_hash = $${paramIndex++}`);
            updateValues.push(passwordHash);
        }

        // Se não há campos para atualizar
        if (updateFields.length === 0) {
            return res.status(400).json({
                message: 'Nenhum campo válido fornecido para atualização.'
            });
        }

        // 3. Executar atualização
        updateValues.push(userId);
        await pool.query(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
            updateValues
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
        // Tratamento de erro de email duplicado
        if (err.code === '23505' && err.constraint && err.constraint.includes('email')) {
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
