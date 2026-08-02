import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { generateAIAssist } from '../ai.js'

const router = Router()

async function loadProfile(userId) {
  const profiles = await query(
    `SELECT * FROM job_seeker_profiles WHERE user_id = :userId LIMIT 1`,
    { userId },
  )
  if (!profiles.length) return null
  const profile = profiles[0]
  const [education, experience, skills] = await Promise.all([
    query(
      `SELECT id, school, degree, field_of_study AS fieldOfStudy,
              start_date AS startDate, end_date AS endDate, grade, description
       FROM resume_education WHERE profile_id = :id ORDER BY sort_order, id`,
      { id: profile.id },
    ),
    query(
      `SELECT id, company, title, location, start_date AS startDate, end_date AS endDate,
              is_current AS isCurrent, description
       FROM resume_experience WHERE profile_id = :id ORDER BY sort_order, id`,
      { id: profile.id },
    ),
    query(
      `SELECT id, skill_name AS skillName, proficiency
       FROM resume_skills WHERE profile_id = :id ORDER BY id`,
      { id: profile.id },
    ),
  ])
  return {
    id: profile.id,
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

async function loadRecruiterProfile(userId) {
  const rows = await query(
    `SELECT ep.*, c.id AS company_id, c.name AS company_name, c.logo_url AS company_logo_url,
            c.website AS company_website, c.description AS company_description,
            c.industry AS company_industry, c.company_size AS company_size,
            c.headquarters AS company_headquarters
     FROM employer_profiles ep
     LEFT JOIN companies c ON c.id = ep.company_id
     WHERE ep.user_id = :userId LIMIT 1`,
    { userId },
  )
  if (!rows.length) return null
  const row = rows[0]
  return {
    id: row.id,
    jobTitle: row.job_title,
    phone: row.phone,
    department: row.department,
    bio: row.bio,
    linkedinUrl: row.linkedin_url,
    notificationEmail: row.notification_email,
    company: row.company_id
      ? {
          id: row.company_id,
          name: row.company_name,
          logoUrl: row.company_logo_url,
          website: row.company_website,
          description: row.company_description,
          industry: row.company_industry,
          companySize: row.company_size,
          headquarters: row.company_headquarters,
        }
      : null,
  }
}

router.get('/seeker', requireAuth, async (req, res) => {
  try {
    const profile = await loadProfile(req.user.id)
    return res.json({ profile })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to load profile.' })
  }
})

router.post('/seeker/ai/parse-resume', requireAuth, async (req, res) => {
  try {
    const { resumeText } = req.body || {}
    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({ message: 'Resume text is required for parsing.' })
    }

    const output = await generateAIAssist('resume-extractor', resumeText, {})

    let parsed = null
    try {
      parsed = JSON.parse(output)
    } catch {
      parsed = null
    }

    return res.json({ parsed: parsed || {}, raw: output })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to parse resume.' })
  }
})

router.put('/seeker', requireAuth, async (req, res) => {
  try {
    const body = req.body
    const existing = await query(
      `SELECT id FROM job_seeker_profiles WHERE user_id = :userId LIMIT 1`,
      { userId: req.user.id },
    )

    let profileId
    if (existing.length) {
      profileId = existing[0].id
      await query(
        `UPDATE job_seeker_profiles SET
          headline = :headline, summary = :summary, phone = :phone,
          location = :location, city = :city, state = :state, country = :country,
          zip_code = :zipCode, desired_salary = :desiredSalary,
          job_type_preference = :jobTypePreference, resume_text = :resumeText,
          resume_file_name = :resumeFileName, resume_file_url = :resumeFileUrl,
          linkedin_url = :linkedinUrl
         WHERE id = :id`,
        {
          id: profileId,
          headline: body.headline || null,
          summary: body.summary || null,
          phone: body.phone || null,
          location: body.location || null,
          city: body.city || null,
          state: body.state || null,
          country: body.country || null,
          zipCode: body.zipCode || null,
          desiredSalary: body.desiredSalary || null,
          jobTypePreference: body.jobTypePreference || 'any',
          resumeText: body.resumeText || null,
          resumeFileName: body.resumeFileName || null,
          resumeFileUrl: body.resumeFileUrl || null,
          linkedinUrl: body.linkedinUrl || null,
        },
      )
    } else {
      const result = await query(
        `INSERT INTO job_seeker_profiles
          (user_id, headline, summary, phone, location, city, state, country, zip_code,
           desired_salary, job_type_preference, resume_text, resume_file_name, resume_file_url, linkedin_url)
         VALUES
          (:userId, :headline, :summary, :phone, :location, :city, :state, :country, :zipCode,
           :desiredSalary, :jobTypePreference, :resumeText, :resumeFileName, :resumeFileUrl, :linkedinUrl)`,
        {
          userId: req.user.id,
          headline: body.headline || null,
          summary: body.summary || null,
          phone: body.phone || null,
          location: body.location || null,
          city: body.city || null,
          state: body.state || null,
          country: body.country || null,
          zipCode: body.zipCode || null,
          desiredSalary: body.desiredSalary || null,
          jobTypePreference: body.jobTypePreference || 'any',
          resumeText: body.resumeText || null,
          resumeFileName: body.resumeFileName || null,
          resumeFileUrl: body.resumeFileUrl || null,
          linkedinUrl: body.linkedinUrl || null,
        },
      )
      profileId = result.insertId
    }

    if (Array.isArray(body.education)) {
      await query(`DELETE FROM resume_education WHERE profile_id = :id`, { id: profileId })
      for (let i = 0; i < body.education.length; i++) {
        const ed = body.education[i]
        if (!ed.school) continue
        await query(
          `INSERT INTO resume_education
            (profile_id, school, degree, field_of_study, start_date, end_date, grade, description, sort_order)
           VALUES (:profileId, :school, :degree, :field, :start, :end, :grade, :desc, :sort)`,
          {
            profileId,
            school: ed.school,
            degree: ed.degree || null,
            field: ed.fieldOfStudy || null,
            start: ed.startDate || null,
            end: ed.endDate || null,
            grade: ed.grade || null,
            desc: ed.description || null,
            sort: i,
          },
        )
      }
    }

    if (Array.isArray(body.experience)) {
      await query(`DELETE FROM resume_experience WHERE profile_id = :id`, { id: profileId })
      for (let i = 0; i < body.experience.length; i++) {
        const ex = body.experience[i]
        if (!ex.company || !ex.title) continue
        await query(
          `INSERT INTO resume_experience
            (profile_id, company, title, location, start_date, end_date, is_current, description, sort_order)
           VALUES (:profileId, :company, :title, :location, :start, :end, :isCurrent, :desc, :sort)`,
          {
            profileId,
            company: ex.company,
            title: ex.title,
            location: ex.location || null,
            start: ex.startDate || null,
            end: ex.endDate || null,
            isCurrent: ex.isCurrent ? 1 : 0,
            desc: ex.description || null,
            sort: i,
          },
        )
      }
    }

    if (Array.isArray(body.skills)) {
      await query(`DELETE FROM resume_skills WHERE profile_id = :id`, { id: profileId })
      for (const sk of body.skills) {
        if (!sk.skillName) continue
        await query(
          `INSERT INTO resume_skills (profile_id, skill_name, proficiency)
           VALUES (:profileId, :name, :prof)`,
          {
            profileId,
            name: sk.skillName,
            prof: sk.proficiency || 'intermediate',
          },
        )
      }
    }

    const profile = await loadProfile(req.user.id)
    return res.json({ profile })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to save profile.' })
  }
})

router.get('/recruiter', requireAuth, async (req, res) => {
  try {
    const profile = await loadRecruiterProfile(req.user.id)
    return res.json({ profile })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to load recruiter profile.' })
  }
})

router.put('/recruiter', requireAuth, async (req, res) => {
  try {
    const body = req.body
    let companyId = body.company?.id || null

    if (body.company?.name) {
      if (companyId) {
        await query(
          `UPDATE companies SET
            name = :name, website = :website, description = :description,
            industry = :industry, company_size = :size, headquarters = :hq, logo_url = :logo
           WHERE id = :id AND (user_id = :userId OR user_id IS NULL)`,
          {
            id: companyId,
            userId: req.user.id,
            name: body.company.name,
            website: body.company.website || null,
            description: body.company.description || null,
            industry: body.company.industry || null,
            size: body.company.companySize || null,
            hq: body.company.headquarters || null,
            logo: body.company.logoUrl || null,
          },
        )
      } else {
        const result = await query(
          `INSERT INTO companies (user_id, name, website, description, industry, company_size, headquarters, logo_url)
           VALUES (:userId, :name, :website, :description, :industry, :size, :hq, :logo)`,
          {
            userId: req.user.id,
            name: body.company.name,
            website: body.company.website || null,
            description: body.company.description || null,
            industry: body.company.industry || null,
            size: body.company.companySize || null,
            hq: body.company.headquarters || null,
            logo: body.company.logoUrl || null,
          },
        )
        companyId = result.insertId
      }
    }

    const existing = await query(
      `SELECT id FROM employer_profiles WHERE user_id = :userId LIMIT 1`,
      { userId: req.user.id },
    )

    if (existing.length) {
      await query(
        `UPDATE employer_profiles SET
          company_id = COALESCE(:companyId, company_id),
          job_title = :jobTitle, phone = :phone, department = :department,
          bio = :bio, linkedin_url = :linkedinUrl, notification_email = :notificationEmail
         WHERE user_id = :userId`,
        {
          userId: req.user.id,
          companyId,
          jobTitle: body.jobTitle || null,
          phone: body.phone || null,
          department: body.department || null,
          bio: body.bio || null,
          linkedinUrl: body.linkedinUrl || null,
          notificationEmail: body.notificationEmail || null,
        },
      )
    } else {
      await query(
        `INSERT INTO employer_profiles
          (user_id, company_id, job_title, phone, department, bio, linkedin_url, notification_email)
         VALUES
          (:userId, :companyId, :jobTitle, :phone, :department, :bio, :linkedinUrl, :notificationEmail)`,
        {
          userId: req.user.id,
          companyId,
          jobTitle: body.jobTitle || 'Recruiter',
          phone: body.phone || null,
          department: body.department || null,
          bio: body.bio || null,
          linkedinUrl: body.linkedinUrl || null,
          notificationEmail: body.notificationEmail || null,
        },
      )
    }

    const profile = await loadRecruiterProfile(req.user.id)
    return res.json({ profile })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to save recruiter profile.' })
  }
})

router.get('/companies', async (_req, res) => {
  try {
    const rows = await query(
      `SELECT id, name, logo_url AS logoUrl, industry, headquarters FROM companies ORDER BY name`,
    )
    return res.json({ companies: rows })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to load companies.' })
  }
})

export default router
