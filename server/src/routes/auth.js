import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { query } from '../db.js'
import {
  createSession,
  destroySession,
  publicUser,
  requireAuth,
  signToken,
} from '../middleware/auth.js'

const router = Router()

async function getPrimaryProvider(userId) {
  const rows = await query(
    `SELECT provider FROM auth_providers
     WHERE user_id = :userId
     ORDER BY id ASC
     LIMIT 1`,
    { userId },
  )
  return rows[0]?.provider || 'email'
}

router.post('/signup', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' })
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' })
    }

    const existing = await query(
      `SELECT id FROM users WHERE email = :email LIMIT 1`,
      { email },
    )
    if (existing.length) {
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const result = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES (:name, :email, :passwordHash)`,
      { name, email, passwordHash },
    )

    const userId = result.insertId
    await query(
      `INSERT INTO auth_providers (user_id, provider, provider_user_id)
       VALUES (:userId, 'email', :email)`,
      { userId, email },
    )

    const user = { id: userId, name, email, avatar_url: null }
    const token = signToken(user)
    await createSession(userId, token)

    return res.status(201).json({
      token,
      user: publicUser(user, 'email'),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Signup failed.' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const users = await query(
      `SELECT id, name, email, password_hash, avatar_url
       FROM users WHERE email = :email LIMIT 1`,
      { email },
    )
    if (!users.length || !users[0].password_hash) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const user = users[0]
    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const token = signToken(user)
    await createSession(user.id, token)
    const provider = await getPrimaryProvider(user.id)

    return res.json({
      token,
      user: publicUser(user, provider),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Login failed.' })
  }
})

router.post('/social', async (req, res) => {
  try {
    const provider = String(req.body.provider || '').trim().toLowerCase()
    const allowed = new Set([
      'google',
      'facebook',
      'apple',
      'github',
      'microsoft',
      'x',
    ])
    if (!allowed.has(provider)) {
      return res.status(400).json({ message: 'Unsupported social provider.' })
    }

    const providerUserId = String(
      req.body.providerUserId || `${provider}-demo-user`,
    ).trim()
    const name = String(
      req.body.name || `${provider.charAt(0).toUpperCase()}${provider.slice(1)} User`,
    ).trim()
    const email = String(
      req.body.email || `${providerUserId}@${provider}.workmate.local`,
    )
      .trim()
      .toLowerCase()

    const linked = await query(
      `SELECT u.id, u.name, u.email, u.avatar_url
       FROM auth_providers ap
       JOIN users u ON u.id = ap.user_id
       WHERE ap.provider = :provider AND ap.provider_user_id = :providerUserId
       LIMIT 1`,
      { provider, providerUserId },
    )

    let user = linked[0]

    if (!user) {
      const byEmail = await query(
        `SELECT id, name, email, avatar_url FROM users WHERE email = :email LIMIT 1`,
        { email },
      )

      if (byEmail.length) {
        user = byEmail[0]
        await query(
          `INSERT IGNORE INTO auth_providers (user_id, provider, provider_user_id)
           VALUES (:userId, :provider, :providerUserId)`,
          { userId: user.id, provider, providerUserId },
        )
      } else {
        const result = await query(
          `INSERT INTO users (name, email, password_hash)
           VALUES (:name, :email, NULL)`,
          { name, email },
        )
        user = {
          id: result.insertId,
          name,
          email,
          avatar_url: null,
        }
        await query(
          `INSERT INTO auth_providers (user_id, provider, provider_user_id)
           VALUES (:userId, :provider, :providerUserId)`,
          { userId: user.id, provider, providerUserId },
        )
      }
    }

    const token = signToken(user)
    await createSession(user.id, token)

    return res.json({
      token,
      user: publicUser(user, provider),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Social login failed.' })
  }
})

router.get('/me', requireAuth, async (req, res) => {
  const provider = await getPrimaryProvider(req.user.id)
  return res.json({ user: publicUser(req.user, provider) })
})

router.post('/logout', requireAuth, async (req, res) => {
  await destroySession(req.token)
  return res.json({ message: 'Logged out.' })
})

export default router
