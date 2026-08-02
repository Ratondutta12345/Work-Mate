import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'
import { generateAIAssist } from '../ai.js'

const router = Router()

function formatJob(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    requirements: row.requirements,
    responsibilities: row.responsibilities,
    jobType: row.job_type,
    experienceLevel: row.experience_level,
    salaryMin: row.salary_min ? Number(row.salary_min) : null,
    salaryMax: row.salary_max ? Number(row.salary_max) : null,
    salaryPeriod: row.salary_period,
    location: row.location,
    city: row.city,
    state: row.state,
    country: row.country,
    isRemote: Boolean(row.is_remote),
    status: row.status,
    createdAt: row.created_at,
    company: {
      id: row.company_id,
      name: row.company_name,
      logoUrl: row.logo_url,
      industry: row.industry,
      headquarters: row.headquarters,
    },
    saved: Boolean(row.saved),
    applied: Boolean(row.applied),
  }
}

router.get('/search', optionalAuth, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    const location = String(req.query.location || '').trim()
    const jobType = String(req.query.jobType || '').trim()
    const limit = Math.min(Number(req.query.limit) || 30, 50)
    const offset = Math.max(Number(req.query.offset) || 0, 0)
    const userId = req.user?.id || null

    const where = ["jp.status = 'active'"]
    const params = {}

    if (q) {
      where.push('(jp.title LIKE :q OR jp.description LIKE :q OR c.name LIKE :q)')
      params.q = `%${q}%`
    }
    if (location) {
      where.push('(jp.location LIKE :loc OR jp.city LIKE :loc OR jp.state LIKE :loc)')
      params.loc = `%${location}%`
    }
    if (jobType && jobType !== 'all') {
      where.push('jp.job_type = :jobType')
      params.jobType = jobType
    }

    const whereSql = where.join(' AND ')
    const savedJoin = userId
      ? `LEFT JOIN saved_job_listings sjl ON sjl.job_posting_id = jp.id AND sjl.user_id = ${Number(userId)}`
      : ''
    const appliedJoin = userId
      ? `LEFT JOIN job_applications ja ON ja.job_posting_id = jp.id AND ja.user_id = ${Number(userId)}`
      : ''
    const savedSelect = userId ? ', (sjl.id IS NOT NULL) AS saved' : ', 0 AS saved'
    const appliedSelect = userId ? ', (ja.id IS NOT NULL) AS applied' : ', 0 AS applied'

    const rows = await query(
      `SELECT jp.*, c.name AS company_name, c.logo_url, c.industry, c.headquarters
              ${savedSelect} ${appliedSelect}
       FROM job_postings jp
       JOIN companies c ON c.id = jp.company_id
       ${savedJoin}
       ${appliedJoin}
       WHERE ${whereSql}
       ORDER BY jp.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params,
    )

    const countRows = await query(
      `SELECT COUNT(*) AS total FROM job_postings jp
       JOIN companies c ON c.id = jp.company_id
       WHERE ${whereSql}`,
      params,
    )

    return res.json({
      total: Number(countRows[0]?.total || 0),
      jobs: rows.map(formatJob),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to search jobs.' })
  }
})

router.get('/ai/search', optionalAuth, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    const location = String(req.query.location || '').trim()
    const jobType = String(req.query.jobType || '').trim()
    const profileSummary = String(req.query.profileSummary || '').trim()
    const output = await generateAIAssist('job-search-assistant', q, {
      location,
      jobType,
      profileSummary,
    })
    let parsed = null
    try {
      parsed = JSON.parse(output)
    } catch {
      parsed = { suggestions: [output], tips: '' }
    }
    return res.json({ suggestions: parsed.suggestions || [], tips: parsed.tips || '' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to generate search suggestions.' })
  }
})

router.post('/:id/ai/cover-letter', requireAuth, async (req, res) => {
  try {
    const jobRows = await query(
      `SELECT jp.title, jp.description, c.name AS company_name
       FROM job_postings jp
       JOIN companies c ON c.id = jp.company_id
       WHERE jp.id = :id AND jp.status = 'active' LIMIT 1`,
      { id: req.params.id },
    )
    if (!jobRows.length) return res.status(404).json({ message: 'Job not found.' })

    const profile = await getFullProfile(req.user.id)
    const profileSummary = profile
      ? `${profile.headline || ''}\n${profile.summary || ''}\nSkills: ${profile.skills?.map((s) => s.skillName).join(', ') || ''}`
      : `${req.user.name} (${req.user.email})`

    const output = await generateAIAssist('cover-letter-writer', '', {
      jobTitle: jobRows[0].title,
      companyName: jobRows[0].company_name,
      jobDescription: jobRows[0].description,
      profileSummary,
    })

    try {
      const parsed = JSON.parse(output)
      return res.json({ coverLetter: parsed.coverLetter || output })
    } catch {
      return res.json({ coverLetter: output })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to generate cover letter.' })
  }
})

router.post('/:id/ai/interview-prep', requireAuth, async (req, res) => {
  try {
    const jobRows = await query(
      `SELECT jp.title, jp.description, c.name AS company_name
       FROM job_postings jp
       JOIN companies c ON c.id = jp.company_id
       WHERE jp.id = :id AND jp.status = 'active' LIMIT 1`,
      { id: req.params.id },
    )
    if (!jobRows.length) return res.status(404).json({ message: 'Job not found.' })

    const profile = await getFullProfile(req.user.id)
    const profileSummary = profile
      ? `${profile.headline || ''}\n${profile.summary || ''}\nSkills: ${profile.skills?.map((s) => s.skillName).join(', ') || ''}`
      : `${req.user.name} (${req.user.email})`

    const output = await generateAIAssist('ai-interview-coach', '', {
      jobTitle: jobRows[0].title,
      companyName: jobRows[0].company_name,
      jobDescription: jobRows[0].description,
      profileSummary,
    })

    try {
      const parsed = JSON.parse(output)
      return res.json({
        questions: parsed.questions || [],
        answers: parsed.answers || [],
        tips: parsed.tips || '',
      })
    } catch {
      return res.json({ questions: [], answers: [], tips: output })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to generate interview prep.' })
  }
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const body = req.body
    let companyId = body.companyId

    if (!companyId && body.companyName) {
      const result = await query(
        `INSERT INTO companies (user_id, name, website, description, industry, company_size, headquarters)
         VALUES (:userId, :name, :website, :description, :industry, :size, :hq)`,
        {
          userId: req.user.id,
          name: body.companyName,
          website: body.companyWebsite || null,
          description: body.companyDescription || null,
          industry: body.industry || null,
          size: body.companySize || null,
          hq: body.headquarters || null,
        },
      )
      companyId = result.insertId
    }

    if (!companyId) {
      return res.status(400).json({ message: 'Company is required.' })
    }

    const result = await query(
      `INSERT INTO job_postings
        (company_id, posted_by_user_id, title, description, requirements, responsibilities,
         job_type, experience_level, salary_min, salary_max, salary_period,
         location, city, state, country, is_remote, status)
       VALUES
        (:companyId, :userId, :title, :description, :requirements, :responsibilities,
         :jobType, :experienceLevel, :salaryMin, :salaryMax, :salaryPeriod,
         :location, :city, :state, :country, :isRemote, 'active')`,
      {
        companyId,
        userId: req.user.id,
        title: body.title,
        description: body.description,
        requirements: body.requirements || null,
        responsibilities: body.responsibilities || null,
        jobType: body.jobType || 'full-time',
        experienceLevel: body.experienceLevel || 'mid',
        salaryMin: body.salaryMin || null,
        salaryMax: body.salaryMax || null,
        salaryPeriod: body.salaryPeriod || 'yearly',
        location: body.location || null,
        city: body.city || null,
        state: body.state || null,
        country: body.country || 'USA',
        isRemote: body.isRemote ? 1 : 0,
      },
    )

    await query(
      `INSERT INTO employer_profiles (user_id, company_id, job_title, phone)
       VALUES (:userId, :companyId, :jobTitle, :phone)
       ON DUPLICATE KEY UPDATE company_id = VALUES(company_id), job_title = VALUES(job_title)`,
      {
        userId: req.user.id,
        companyId,
        jobTitle: body.recruiterTitle || 'Recruiter',
        phone: body.phone || null,
      },
    )

    return res.status(201).json({ id: result.insertId })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to post job.' })
  }
})

router.get('/recruiter/mine', requireAuth, async (req, res) => {
  try {
    const rows = await query(
      `SELECT jp.*, c.name AS company_name, c.logo_url, c.industry, c.headquarters,
              (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_posting_id = jp.id) AS applicationCount
       FROM job_postings jp
       JOIN companies c ON c.id = jp.company_id
       WHERE jp.posted_by_user_id = :userId
       ORDER BY jp.created_at DESC`,
      { userId: req.user.id },
    )
    return res.json({
      jobs: rows.map((row) => ({
        ...formatJob(row),
        applicationCount: Number(row.applicationCount || 0),
      })),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to load your job postings.' })
  }
})

router.get('/recruiter/applications', requireAuth, async (req, res) => {
  try {
    const jobId = req.query.jobId ? Number(req.query.jobId) : null
    const status = String(req.query.status || '').trim()
    const params = { userId: req.user.id }
    const where = ['jp.posted_by_user_id = :userId']

    if (jobId) {
      where.push('ja.job_posting_id = :jobId')
      params.jobId = jobId
    }
    if (status && status !== 'all') {
      where.push('ja.status = :status')
      params.status = status
    }

    const rows = await query(
      `SELECT ja.id, ja.status, ja.cover_letter AS coverLetter, ja.applied_at AS appliedAt,
              ja.updated_at AS updatedAt, jp.id AS jobId, jp.title AS jobTitle,
              c.name AS companyName, u.id AS applicantId, u.name AS applicantName,
              u.email AS applicantEmail, jsp.headline AS applicantHeadline,
              jsp.phone AS applicantPhone, jsp.location AS applicantLocation
       FROM job_applications ja
       JOIN job_postings jp ON jp.id = ja.job_posting_id
       JOIN companies c ON c.id = jp.company_id
       JOIN users u ON u.id = ja.user_id
       LEFT JOIN job_seeker_profiles jsp ON jsp.user_id = ja.user_id
       WHERE ${where.join(' AND ')}
       ORDER BY ja.applied_at DESC`,
      params,
    )
    return res.json({ applications: rows })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to load applications.' })
  }
})

router.get('/recruiter/applications/:appId', requireAuth, async (req, res) => {
  try {
    const rows = await query(
      `SELECT ja.id, ja.status, ja.cover_letter AS coverLetter, ja.resume_snapshot AS resumeSnapshot,
              ja.applied_at AS appliedAt, ja.updated_at AS updatedAt,
              jp.id AS jobId, jp.title AS jobTitle, jp.location AS jobLocation,
              c.name AS companyName, u.id AS applicantId, u.name AS applicantName,
              u.email AS applicantEmail, u.avatar_url AS applicantAvatar
       FROM job_applications ja
       JOIN job_postings jp ON jp.id = ja.job_posting_id
       JOIN companies c ON c.id = jp.company_id
       JOIN users u ON u.id = ja.user_id
       WHERE ja.id = :appId AND jp.posted_by_user_id = :userId
       LIMIT 1`,
      { appId: req.params.appId, userId: req.user.id },
    )
    if (!rows.length) return res.status(404).json({ message: 'Application not found.' })

    const row = rows[0]
    let snapshot = null
    if (row.resumeSnapshot) {
      try {
        snapshot = typeof row.resumeSnapshot === 'string'
          ? JSON.parse(row.resumeSnapshot)
          : row.resumeSnapshot
      } catch {
        snapshot = null
      }
    }

    const history = await query(
      `SELECT ash.id, ash.old_status AS oldStatus, ash.new_status AS newStatus,
              ash.note, ash.created_at AS createdAt, u.name AS changedByName
       FROM application_status_history ash
       LEFT JOIN users u ON u.id = ash.changed_by_user_id
       WHERE ash.application_id = :appId
       ORDER BY ash.created_at ASC`,
      { appId: req.params.appId },
    )

    const profileRows = await query(
      `SELECT * FROM job_seeker_profiles WHERE user_id = :userId LIMIT 1`,
      { userId: row.applicantId },
    )

    let liveProfile = null
    if (profileRows.length) {
      liveProfile = await getFullProfile(row.applicantId)
      liveProfile.name = row.applicantName
      liveProfile.email = row.applicantEmail
    }

    return res.json({
      application: {
        id: row.id,
        status: row.status,
        coverLetter: row.coverLetter,
        appliedAt: row.appliedAt,
        updatedAt: row.updatedAt,
        resumeSnapshot: snapshot,
        liveProfile,
        job: {
          id: row.jobId,
          title: row.jobTitle,
          location: row.jobLocation,
          companyName: row.companyName,
        },
        applicant: {
          id: row.applicantId,
          name: row.applicantName,
          email: row.applicantEmail,
          avatarUrl: row.applicantAvatar,
        },
        statusHistory: history,
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to load application.' })
  }
})

router.patch('/recruiter/applications/:appId/status', requireAuth, async (req, res) => {
  try {
    const newStatus = req.body.status
    const note = req.body.note || null
    const allowed = ['applied', 'reviewed', 'interview', 'rejected', 'hired', 'withdrawn']
    if (!allowed.includes(newStatus)) {
      return res.status(400).json({ message: 'Invalid status.' })
    }

    const rows = await query(
      `SELECT ja.id, ja.status FROM job_applications ja
       JOIN job_postings jp ON jp.id = ja.job_posting_id
       WHERE ja.id = :appId AND jp.posted_by_user_id = :userId LIMIT 1`,
      { appId: req.params.appId, userId: req.user.id },
    )
    if (!rows.length) return res.status(404).json({ message: 'Application not found.' })

    const oldStatus = rows[0].status
    if (oldStatus === newStatus) {
      return res.json({ status: newStatus })
    }

    await query(
      `UPDATE job_applications SET status = :status WHERE id = :id`,
      { status: newStatus, id: req.params.appId },
    )

    await query(
      `INSERT INTO application_status_history
        (application_id, old_status, new_status, changed_by_user_id, note)
       VALUES (:appId, :oldStatus, :newStatus, :userId, :note)`,
      {
        appId: req.params.appId,
        oldStatus,
        newStatus,
        userId: req.user.id,
        note,
      },
    )

    return res.json({ status: newStatus })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to update status.' })
  }
})

router.get('/applications/mine', requireAuth, async (req, res) => {
  try {
    const rows = await query(
      `SELECT ja.id, ja.status, ja.cover_letter AS coverLetter, ja.applied_at AS appliedAt,
              ja.updated_at AS updatedAt, jp.id AS jobId, jp.title, jp.location, jp.job_type AS jobType,
              c.name AS companyName, c.logo_url AS logoUrl
       FROM job_applications ja
       JOIN job_postings jp ON jp.id = ja.job_posting_id
       JOIN companies c ON c.id = jp.company_id
       WHERE ja.user_id = :userId
       ORDER BY ja.applied_at DESC`,
      { userId: req.user.id },
    )
    return res.json({ applications: rows })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to load applications.' })
  }
})

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id || null
    const savedJoin = userId
      ? `LEFT JOIN saved_job_listings sjl ON sjl.job_posting_id = jp.id AND sjl.user_id = ${Number(userId)}`
      : ''
    const appliedJoin = userId
      ? `LEFT JOIN job_applications ja ON ja.job_posting_id = jp.id AND ja.user_id = ${Number(userId)}`
      : ''
    const savedSelect = userId ? ', (sjl.id IS NOT NULL) AS saved' : ', 0 AS saved'
    const appliedSelect = userId ? ', (ja.id IS NOT NULL) AS applied' : ', 0 AS applied'

    const rows = await query(
      `SELECT jp.*, c.name AS company_name, c.logo_url, c.industry, c.headquarters, c.description AS company_description, c.website AS company_website
              ${savedSelect} ${appliedSelect}
       FROM job_postings jp
       JOIN companies c ON c.id = jp.company_id
       ${savedJoin}
       ${appliedJoin}
       WHERE jp.id = :id LIMIT 1`,
      { id: req.params.id },
    )
    if (!rows.length) return res.status(404).json({ message: 'Job not found.' })
    const job = formatJob(rows[0])
    job.company.description = rows[0].company_description
    job.company.website = rows[0].company_website
    return res.json({ job })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to load job.' })
  }
})

router.post('/:id/apply', requireAuth, async (req, res) => {
  try {
    const jobRows = await query(
      `SELECT jp.id, jp.title FROM job_postings jp WHERE jp.id = :id AND jp.status = 'active' LIMIT 1`,
      { id: req.params.id },
    )
    if (!jobRows.length) return res.status(404).json({ message: 'Job not found.' })

    const profile = await getFullProfile(req.user.id)
    const snapshot = profile || { name: req.user.name, email: req.user.email }

    const result = await query(
      `INSERT INTO job_applications (job_posting_id, user_id, cover_letter, resume_snapshot, status)
       VALUES (:jobId, :userId, :coverLetter, :snapshot, 'applied')`,
      {
        jobId: req.params.id,
        userId: req.user.id,
        coverLetter: req.body.coverLetter || null,
        snapshot: JSON.stringify(snapshot),
      },
    )

    await query(
      `INSERT INTO application_status_history
        (application_id, old_status, new_status, changed_by_user_id, note)
       VALUES (:appId, NULL, 'applied', :userId, 'Application submitted')`,
      { appId: result.insertId, userId: req.user.id },
    )

    return res.status(201).json({ id: result.insertId, status: 'applied' })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'You already applied to this job.' })
    }
    console.error(error)
    return res.status(500).json({ message: 'Failed to submit application.' })
  }
})

router.post('/:id/save', requireAuth, async (req, res) => {
  try {
    await query(
      `INSERT IGNORE INTO saved_job_listings (user_id, job_posting_id) VALUES (:userId, :jobId)`,
      { userId: req.user.id, jobId: req.params.id },
    )
    return res.json({ saved: true })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to save job.' })
  }
})

router.delete('/:id/save', requireAuth, async (req, res) => {
  try {
    await query(
      `DELETE FROM saved_job_listings WHERE user_id = :userId AND job_posting_id = :jobId`,
      { userId: req.user.id, jobId: req.params.id },
    )
    return res.json({ saved: false })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to unsave job.' })
  }
})

async function getFullProfile(userId) {
  const profiles = await query(
    `SELECT jsp.*, u.name, u.email FROM job_seeker_profiles jsp
     JOIN users u ON u.id = jsp.user_id
     WHERE jsp.user_id = :userId LIMIT 1`,
    { userId },
  )
  if (!profiles.length) return null
  const profile = profiles[0]
  const [education, experience, skills] = await Promise.all([
    query(
      `SELECT school, degree, field_of_study AS fieldOfStudy, start_date AS startDate,
              end_date AS endDate, grade, description
       FROM resume_education WHERE profile_id = :id ORDER BY sort_order`,
      { id: profile.id },
    ),
    query(
      `SELECT company, title, location, start_date AS startDate, end_date AS endDate,
              is_current AS isCurrent, description
       FROM resume_experience WHERE profile_id = :id ORDER BY sort_order`,
      { id: profile.id },
    ),
    query(
      `SELECT skill_name AS skillName, proficiency FROM resume_skills WHERE profile_id = :id`,
      { id: profile.id },
    ),
  ])
  return {
    name: profile.name,
    email: profile.email,
    headline: profile.headline,
    summary: profile.summary,
    phone: profile.phone,
    location: profile.location,
    city: profile.city,
    state: profile.state,
    country: profile.country,
    zipCode: profile.zip_code,
    desiredSalary: profile.desired_salary,
    jobTypePreference: profile.job_type_preference,
    resumeText: profile.resume_text,
    resumeFileName: profile.resume_file_name,
    resumeFileUrl: profile.resume_file_url,
    linkedinUrl: profile.linkedin_url,
    education,
    experience,
    skills,
  }
}

export default router
