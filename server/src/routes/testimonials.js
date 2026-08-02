import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const testimonials = await query(
      `SELECT id, quote, author_name AS name, company, rating, published_on AS date
       FROM testimonials
       WHERE is_active = 1
       ORDER BY id ASC`,
    )
    return res.json({ testimonials })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to load testimonials.' })
  }
})

export default router
