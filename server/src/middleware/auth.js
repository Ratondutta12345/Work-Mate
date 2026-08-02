import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { query } from '../db.js'

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      jti: crypto.randomUUID(),
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  )
}

export function publicUser(row, provider = 'email') {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatar_url || null,
    provider,
  }
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) {
      return res.status(401).json({ message: 'Authentication required.' })
    }

    const payload = jwt.verify(token, config.jwtSecret)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const sessions = await query(
      `SELECT id FROM user_sessions
       WHERE user_id = :userId AND token_hash = :tokenHash AND expires_at > NOW()
       LIMIT 1`,
      { userId: payload.sub, tokenHash },
    )

    if (!sessions.length) {
      return res.status(401).json({ message: 'Session expired. Please login again.' })
    }

    const users = await query(
      `SELECT id, name, email, avatar_url FROM users WHERE id = :id LIMIT 1`,
      { id: payload.sub },
    )
    if (!users.length) {
      return res.status(401).json({ message: 'User not found.' })
    }

    req.user = users[0]
    req.token = token
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}

export async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) {
      req.user = null
      return next()
    }

    const payload = jwt.verify(token, config.jwtSecret)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const sessions = await query(
      `SELECT id FROM user_sessions
       WHERE user_id = :userId AND token_hash = :tokenHash AND expires_at > NOW()
       LIMIT 1`,
      { userId: payload.sub, tokenHash },
    )
    if (!sessions.length) {
      req.user = null
      return next()
    }

    const users = await query(
      `SELECT id, name, email, avatar_url FROM users WHERE id = :id LIMIT 1`,
      { id: payload.sub },
    )
    req.user = users[0] || null
    req.token = token
    next()
  } catch {
    req.user = null
    next()
  }
}

export async function createSession(userId, token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await query(
    `INSERT INTO user_sessions (user_id, token_hash, expires_at)
     VALUES (:userId, :tokenHash, :expiresAt)`,
    {
      userId,
      tokenHash,
      expiresAt: expiresAt.toISOString().slice(0, 19).replace('T', ' '),
    },
  )
}

export async function destroySession(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  await query(`DELETE FROM user_sessions WHERE token_hash = :tokenHash`, {
    tokenHash,
  })
}
