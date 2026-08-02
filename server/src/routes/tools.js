import { Router } from 'express'
import { query } from '../db.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { generateToolOutput } from '../ai.js'
import { bumpDailyStats, makeTitle } from './dashboard.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const tools = await query(
      `SELECT id, slug, title, description, icon, hint,
              result_action AS resultAction, category
       FROM tools
       WHERE is_active = 1
       ORDER BY sort_order ASC, id ASC`,
    )
    return res.json({ tools })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to load tools.' })
  }
})

router.get('/history/me', requireAuth, async (req, res) => {
  try {
    const runs = await query(
      `SELECT tr.id, tr.title, tr.input_text AS input, tr.output_text AS output,
              tr.category, tr.result_action AS resultAction,
              tr.created_at AS createdAt, t.slug, t.title AS toolTitle, t.icon
       FROM tool_runs tr
       JOIN tools t ON t.id = tr.tool_id
       WHERE tr.user_id = :userId
       ORDER BY tr.created_at DESC
       LIMIT 50`,
      { userId: req.user.id },
    )
    return res.json({ runs })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to load history.' })
  }
})

router.get('/:slug', async (req, res) => {
  try {
    const tools = await query(
      `SELECT id, slug, title, description, icon, hint,
              result_action AS resultAction, category
       FROM tools
       WHERE slug = :slug AND is_active = 1
       LIMIT 1`,
      { slug: req.params.slug },
    )
    if (!tools.length) {
      return res.status(404).json({ message: 'Tool not found.' })
    }
    return res.json({ tool: tools[0] })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to load tool.' })
  }
})

router.post('/:slug/run', optionalAuth, async (req, res) => {
  try {
    const input = String(req.body.input || '').trim()
    const options = req.body.options && typeof req.body.options === 'object' ? req.body.options : {}
    const files = Array.isArray(options.files) ? options.files : []
    if (!input && !files.length) {
      return res.status(400).json({ message: 'Input is required.' })
    }

    const tools = await query(
      `SELECT id, slug, title, description, icon, hint,
              result_action AS resultAction, category
       FROM tools
       WHERE slug = :slug AND is_active = 1
       LIMIT 1`,
      { slug: req.params.slug },
    )
    if (!tools.length) {
      return res.status(404).json({ message: 'Tool not found.' })
    }

    const tool = tools[0]
    const output = await generateToolOutput(tool, input, options)
    const userId = req.user?.id || null
    const title = makeTitle(input || `${tool.title} request`)
    const category = tool.category || 'other'

    const result = await query(
      `INSERT INTO tool_runs
        (user_id, tool_id, title, category, input_text, output_text, status, result_action)
       VALUES
        (:userId, :toolId, :title, :category, :inputText, :outputText, 'completed', :resultAction)`,
      {
        userId,
        toolId: tool.id,
        title,
        category,
        inputText: input,
        outputText: output,
        resultAction: tool.resultAction,
      },
    )

    if (userId) {
      await bumpDailyStats(userId, category)
    }

    return res.status(201).json({
      run: {
        id: result.insertId,
        title,
        category,
        tool,
        input,
        output,
        resultAction: tool.resultAction,
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to run tool.' })
  }
})

export default router
