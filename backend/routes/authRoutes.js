import express from 'express'
import bcrypt from 'bcrypt'
import { pool } from '../db.js'

const router = express.Router()
const saltRounds = 10

export const registerHandler = async (req, res) => {
  const { name, email, phone, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' })
  }
  try {
    const passwordHash = await bcrypt.hash(password, saltRounds)
    const newUser = await pool.query(
      'INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
      [name, email, phone, passwordHash]
    )

    res.status(201).json({
      message: 'Usuário criado com sucesso!',
      user: newUser.rows[0]
    })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Este e-mail já está em uso.' })
    }
    console.error('Erro no cadastro:', err)
    res.status(500).json({ message: 'Erro interno do servidor.' })
  }
}

export const loginHandler = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' })
  }

  try {
    const userResult = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [email]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' })
    }

    const user = userResult.rows[0]

    const isMatch = await bcrypt.compare(password, user.password_hash)

    if (!isMatch) {
      return res.status(401).json({ message: 'Senha incorreta.' })
    }

    res.status(200).json({
      message: `Bem-vindo de volta, ${user.name}!`,
      user: { id: user.id, name: user.name, email: user.email }
    })
  } catch (err) {
    console.error('Erro no login:', err)
    res.status(500).json({ message: 'Erro interno do servidor.' })
  }
}

router.post('/register', registerHandler)
router.post('/login', loginHandler)

export default router