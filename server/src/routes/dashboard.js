import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function makeTitle(input) {
  const cleaned = String(input || '').replace(/\s+/g, ' ').trim()
  if (!cleaned) return 'Untitled job'
  return cleaned.length > 80 ? `${cleaned.slice(0, 77)}...` : cleaned
}

export async function bumpDailyStats(userId, category) {
  if (!userId) return
  const writing = category === 'writing' ? 1 : 0
  const image = category === 'image' ? 1 : 0
  const resume = category === 'resume' ? 1 : 0

  await query(
    `INSERT INTO user_daily_stats
      (user_id, stat_date, total_jobs, writing_jobs, image_jobs, resume_jobs)
     VALUES (:userId, CURDATE(), 1, :writing, :image, :resume)
     ON DUPLICATE KEY UPDATE
       total_jobs = total_jobs + 1,
       writing_jobs = writing_jobs + VALUES(writing_jobs),
       image_jobs = image_jobs + VALUES(image_jobs),
       resume_jobs = resume_jobs + VALUES(resume_jobs)`,
    { userId, writing, image, resume },
  )
}

export { makeTitle }

router.get('/overview', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id

    const totals = await query(
      `SELECT
         COUNT(*) AS totalJobs,
         SUM(category = 'writing') AS writingJobs,
         SUM(category = 'image') AS imageJobs,
         SUM(category = 'resume') AS resumeJobs,
         SUM(DATE(created_at) = CURDATE()) AS todayJobs
       FROM tool_runs
       WHERE user_id = :userId AND status = 'completed'`,
      { userId },
    )

    const byTool = await query(
      `SELECT t.slug, t.title, t.icon, t.category, COUNT(tr.id) AS count
       FROM tools t
       LEFT JOIN tool_runs tr
         ON tr.tool_id = t.id AND tr.user_id = :userId AND tr.status = 'completed'
       WHERE t.is_active = 1
       GROUP BY t.id
       ORDER BY t.sort_order ASC`,
      { userId },
    )

    const recent = await query(
      `SELECT tr.id, tr.title, tr.input_text AS input, tr.output_text AS output,
              tr.category, tr.result_action AS resultAction, tr.status,
              tr.created_at AS createdAt, t.slug, t.title AS toolTitle, t.icon,
              EXISTS(
                SELECT 1 FROM saved_jobs sj
                WHERE sj.user_id = :userId AND sj.tool_run_id = tr.id
              ) AS saved
       FROM tool_runs tr
       JOIN tools t ON t.id = tr.tool_id
       WHERE tr.user_id = :userId
       ORDER BY tr.created_at DESC
       LIMIT 8`,
      { userId },
    )

    const daily = await query(
      `SELECT stat_date AS date, total_jobs AS total,
              writing_jobs AS writing, image_jobs AS image, resume_jobs AS resume
       FROM user_daily_stats
       WHERE user_id = :userId
       ORDER BY stat_date DESC
       LIMIT 14`,
      { userId },
    )

    const overview = totals[0] || {}
    return res.json({
      overview: {
        totalJobs: Number(overview.totalJobs || 0),
        writingJobs: Number(overview.writingJobs || 0),
        imageJobs: Number(overview.imageJobs || 0),
        resumeJobs: Number(overview.resumeJobs || 0),
        todayJobs: Number(overview.todayJobs || 0),
      },
      byTool: byTool.map((row) => ({
        ...row,
        count: Number(row.count || 0),
      })),
      recent: recent.map((row) => ({
        ...row,
        saved: Boolean(row.saved),
      })),
      daily,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to load dashboard overview.' })
  }
})

router.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const category = String(req.query.category || 'all').toLowerCase()
    const slug = String(req.query.slug || '').trim()
    const search = String(req.query.q || '').trim()
    const limit = Math.min(Number(req.query.limit) || 50, 100)
    const offset = Math.max(Number(req.query.offset) || 0, 0)

    const where = ['tr.user_id = :userId']
    const params = { userId, limit, offset }

    if (['writing', 'image', 'resume', 'other'].includes(category)) {
      where.push('tr.category = :category')
      params.category = category
    }
    if (slug) {
      where.push('t.slug = :slug')
      params.slug = slug
    }
    if (search) {
      where.push('(tr.title LIKE :search OR tr.input_text LIKE :search OR tr.output_text LIKE :search)')
      params.search = `%${search}%`
    }

    const whereSql = where.join(' AND ')

    const runs = await query(
      `SELECT tr.id, tr.title, tr.input_text AS input, tr.output_text AS output,
              tr.category, tr.result_action AS resultAction, tr.status,
              tr.created_at AS createdAt, t.slug, t.title AS toolTitle, t.icon,
              EXISTS(
                SELECT 1 FROM saved_jobs sj
                WHERE sj.user_id = :userId AND sj.tool_run_id = tr.id
              ) AS saved
       FROM tool_runs tr
       JOIN tools t ON t.id = tr.tool_id
       WHERE ${whereSql}
       ORDER BY tr.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params,
    )

    const countRows = await query(
      `SELECT COUNT(*) AS total
       FROM tool_runs tr
       JOIN tools t ON t.id = tr.tool_id
       WHERE ${whereSql}`,
      params,
    )

    return res.json({
      total: Number(countRows[0]?.total || 0),
      runs: runs.map((row) => ({
        ...row,
        saved: Boolean(row.saved),
      })),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to load job history.' })
  }
})

router.get('/history/:id', requireAuth, async (req, res) => {
  try {
    const rows = await query(
      `SELECT tr.id, tr.title, tr.input_text AS input, tr.output_text AS output,
              tr.category, tr.result_action AS resultAction, tr.status,
              tr.created_at AS createdAt, t.slug, t.title AS toolTitle, t.icon,
              EXISTS(
                SELECT 1 FROM saved_jobs sj
                WHERE sj.user_id = :userId AND sj.tool_run_id = tr.id
              ) AS saved
       FROM tool_runs tr
       JOIN tools t ON t.id = tr.tool_id
       WHERE tr.id = :id AND tr.user_id = :userId
       LIMIT 1`,
      { id: req.params.id, userId: req.user.id },
    )
    if (!rows.length) {
      return res.status(404).json({ message: 'Job not found.' })
    }
    return res.json({
      job: { ...rows[0], saved: Boolean(rows[0].saved) },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to load job.' })
  }
})

router.post('/history/:id/save', requireAuth, async (req, res) => {
  try {
    const rows = await query(
      `SELECT id FROM tool_runs WHERE id = :id AND user_id = :userId LIMIT 1`,
      { id: req.params.id, userId: req.user.id },
    )
    if (!rows.length) {
      return res.status(404).json({ message: 'Job not found.' })
    }

    await query(
      `INSERT IGNORE INTO saved_jobs (user_id, tool_run_id)
       VALUES (:userId, :toolRunId)`,
      { userId: req.user.id, toolRunId: req.params.id },
    )
    return res.json({ saved: true })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to save job.' })
  }
})

router.delete('/history/:id/save', requireAuth, async (req, res) => {
  try {
    await query(
      `DELETE FROM saved_jobs
       WHERE user_id = :userId AND tool_run_id = :toolRunId`,
      { userId: req.user.id, toolRunId: req.params.id },
    )
    return res.json({ saved: false })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to unsave job.' })
  }
})

router.delete('/history/:id', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `DELETE FROM tool_runs WHERE id = :id AND user_id = :userId`,
      { id: req.params.id, userId: req.user.id },
    )
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Job not found.' })
    }
    return res.json({ deleted: true })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to delete job.' })
  }
})

export default router
