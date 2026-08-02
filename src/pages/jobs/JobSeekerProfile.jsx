import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchSeekerProfile, saveSeekerProfile, parseResumeText } from '../../services/jobsApi'
import '../Jobs.css'

const emptyEducation = () => ({
  school: '',
  degree: '',
  fieldOfStudy: '',
  startDate: '',
  endDate: '',
  grade: '',
  description: '',
})

const emptyExperience = () => ({
  company: '',
  title: '',
  location: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  description: '',
})

function JobSeekerProfile() {
  const { user, ready } = useAuth()
  const [form, setForm] = useState({
    headline: '',
    summary: '',
    phone: '',
    location: '',
    city: '',
    state: '',
    country: 'USA',
    zipCode: '',
    desiredSalary: '',
    jobTypePreference: 'any',
    resumeText: '',
    resumeFileName: '',
    resumeFileUrl: '',
    linkedinUrl: '',
    education: [emptyEducation()],
    experience: [emptyExperience()],
    skills: [{ skillName: '', proficiency: 'intermediate' }],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchSeekerProfile()
      .then((data) => {
        if (data.profile) {
          setForm({
            ...form,
            ...data.profile,
            education: data.profile.education?.length
              ? data.profile.education
              : [emptyEducation()],
            experience: data.profile.experience?.length
              ? data.profile.experience
              : [emptyExperience()],
            skills: data.profile.skills?.length
              ? data.profile.skills
              : [{ skillName: '', proficiency: 'intermediate' }],
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const updateList = (key, index, field, value) => {
    setForm((f) => ({
      ...f,
      [key]: f[key].map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  const addListItem = (key, empty) => {
    setForm((f) => ({ ...f, [key]: [...f[key], empty()] }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await saveSeekerProfile({
        ...form,
        education: form.education.filter((e) => e.school),
        experience: form.experience.filter((e) => e.company && e.title),
        skills: form.skills.filter((s) => s.skillName),
      })
      setMessage('Profile saved successfully.')
    } catch (err) {
      setMessage(err.message || 'Could not save profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleResumeFile = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setForm((f) => ({ ...f, resumeFileName: file.name }))
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const reader = new FileReader()
      reader.onload = () => {
        setForm((f) => ({ ...f, resumeText: String(reader.result || ''), resumeFileName: file.name }))
      }
      reader.readAsText(file)
    }
  }

  const handleParseResume = async () => {
    if (!form.resumeText?.trim()) {
      setMessage('Enter resume text first.')
      return
    }
    setParsing(true)
    setMessage('')
    try {
      const data = await parseResumeText(form.resumeText)
      const parsed = data.parsed || {}
      setForm((current) => ({
        ...current,
        headline: parsed.headline || current.headline,
        summary: parsed.summary || current.summary,
        location: parsed.location || current.location,
        city: parsed.city || current.city,
        state: parsed.state || current.state,
        country: parsed.country || current.country,
        zipCode: parsed.zipCode || current.zipCode,
        desiredSalary: parsed.desiredSalary || current.desiredSalary,
        jobTypePreference: parsed.jobTypePreference || current.jobTypePreference,
        linkedinUrl: parsed.linkedinUrl || current.linkedinUrl,
        skills: Array.isArray(parsed.skills) && parsed.skills.length
          ? parsed.skills.map((skill) => ({
              skillName: skill.skillName || '',
              proficiency: skill.proficiency || 'intermediate',
            }))
          : current.skills,
        education: Array.isArray(parsed.education) && parsed.education.length
          ? parsed.education.map((edu) => ({
              school: edu.school || '',
              degree: edu.degree || '',
              fieldOfStudy: edu.fieldOfStudy || '',
              startDate: edu.startDate || '',
              endDate: edu.endDate || '',
              grade: edu.grade || '',
              description: edu.description || '',
            }))
          : current.education,
        experience: Array.isArray(parsed.experience) && parsed.experience.length
          ? parsed.experience.map((exp) => ({
              company: exp.company || '',
              title: exp.title || '',
              location: exp.location || '',
              startDate: exp.startDate || '',
              endDate: exp.endDate || '',
              isCurrent: Boolean(exp.isCurrent),
              description: exp.description || '',
            }))
          : current.experience,
      }))
      setMessage('Resume parsed successfully. Review and save your profile.')
    } catch (err) {
      setMessage(err.message || 'Failed to parse resume.')
    } finally {
      setParsing(false)
    }
  }

  if (!ready) return <p className="jobs-empty">Loading…</p>
  if (!user) return <Navigate to="/login" replace state={{ from: '/get-started/jobs/profile' }} />

  if (loading) return <p className="jobs-empty">Loading profile…</p>

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
        <section>
          <h2>Basic information</h2>
          <div className="form-grid">
            <label>
              Headline
              <input value={form.headline} onChange={(e) => update('headline', e.target.value)} placeholder="e.g. Software Engineer | React & Node.js" />
            </label>
            <label>
              Phone
              <input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </label>
            <label>
              Location
              <input value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="City, State" />
            </label>
            <label>
              City
              <input value={form.city} onChange={(e) => update('city', e.target.value)} />
            </label>
            <label>
              State
              <input value={form.state} onChange={(e) => update('state', e.target.value)} />
            </label>
            <label>
              Desired salary
              <input value={form.desiredSalary} onChange={(e) => update('desiredSalary', e.target.value)} placeholder="$80,000" />
            </label>
            <label>
              Job type preference
              <select value={form.jobTypePreference} onChange={(e) => update('jobTypePreference', e.target.value)}>
                <option value="any">Any</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="remote">Remote</option>
                <option value="internship">Internship</option>
              </select>
            </label>
            <label>
              LinkedIn URL
              <input value={form.linkedinUrl} onChange={(e) => update('linkedinUrl', e.target.value)} />
            </label>
          </div>
          <label>
            Professional summary
            <textarea rows={4} value={form.summary} onChange={(e) => update('summary', e.target.value)} placeholder="Brief overview of your experience and goals…" />
          </label>
          <label>
            Resume / additional details
            <textarea rows={6} value={form.resumeText} onChange={(e) => update('resumeText', e.target.value)} placeholder="Paste your full resume or additional details…" />
          </label>
          <div className="resume-actions">
            <label>
              Upload resume (.txt)
              <input type="file" accept=".txt,text/plain" onChange={handleResumeFile} />
            </label>
            <button type="button" className="jobs-ai-button" onClick={handleParseResume} disabled={parsing || !form.resumeText.trim()}>
              {parsing ? 'Parsing…' : 'Extract profile from resume'}
            </button>
          </div>
          {form.resumeFileName ? (
            <p className="resume-file-tag">Current file: {form.resumeFileName}</p>
          ) : null}
          <label>
            Resume file URL (optional)
            <input value={form.resumeFileUrl} onChange={(e) => update('resumeFileUrl', e.target.value)} placeholder="Link to PDF or hosted resume" />
          </label>
        </section>

        <section>
          <div className="section-head">
            <h2>Work experience</h2>
            <button type="button" onClick={() => addListItem('experience', emptyExperience)}>+ Add</button>
          </div>
          {form.experience.map((exp, i) => (
            <div key={i} className="form-block">
              <div className="form-grid">
                <label>Company<input value={exp.company} onChange={(e) => updateList('experience', i, 'company', e.target.value)} /></label>
                <label>Job title<input value={exp.title} onChange={(e) => updateList('experience', i, 'title', e.target.value)} /></label>
                <label>Location<input value={exp.location} onChange={(e) => updateList('experience', i, 'location', e.target.value)} /></label>
                <label>Start date<input type="date" value={exp.startDate?.slice?.(0, 10) || exp.startDate || ''} onChange={(e) => updateList('experience', i, 'startDate', e.target.value)} /></label>
                <label>End date<input type="date" value={exp.endDate?.slice?.(0, 10) || exp.endDate || ''} onChange={(e) => updateList('experience', i, 'endDate', e.target.value)} disabled={exp.isCurrent} /></label>
                <label className="checkbox-label">
                  <input type="checkbox" checked={exp.isCurrent} onChange={(e) => updateList('experience', i, 'isCurrent', e.target.checked)} />
                  Currently working here
                </label>
              </div>
              <label>Description<textarea rows={3} value={exp.description} onChange={(e) => updateList('experience', i, 'description', e.target.value)} /></label>
            </div>
          ))}
        </section>

        <section>
          <div className="section-head">
            <h2>Education</h2>
            <button type="button" onClick={() => addListItem('education', emptyEducation)}>+ Add</button>
          </div>
          {form.education.map((ed, i) => (
            <div key={i} className="form-block">
              <div className="form-grid">
                <label>School<input value={ed.school} onChange={(e) => updateList('education', i, 'school', e.target.value)} /></label>
                <label>Degree<input value={ed.degree} onChange={(e) => updateList('education', i, 'degree', e.target.value)} /></label>
                <label>Field of study<input value={ed.fieldOfStudy} onChange={(e) => updateList('education', i, 'fieldOfStudy', e.target.value)} /></label>
                <label>Grade<input value={ed.grade} onChange={(e) => updateList('education', i, 'grade', e.target.value)} /></label>
                <label>Start<input type="date" value={ed.startDate?.slice?.(0, 10) || ed.startDate || ''} onChange={(e) => updateList('education', i, 'startDate', e.target.value)} /></label>
                <label>End<input type="date" value={ed.endDate?.slice?.(0, 10) || ed.endDate || ''} onChange={(e) => updateList('education', i, 'endDate', e.target.value)} /></label>
              </div>
            </div>
          ))}
        </section>

        <section>
          <div className="section-head">
            <h2>Skills</h2>
            <button type="button" onClick={() => addListItem('skills', () => ({ skillName: '', proficiency: 'intermediate' }))}>+ Add</button>
          </div>
          <div className="skills-grid">
            {form.skills.map((sk, i) => (
              <div key={i} className="skill-row">
                <input value={sk.skillName} onChange={(e) => updateList('skills', i, 'skillName', e.target.value)} placeholder="Skill name" />
                <select value={sk.proficiency} onChange={(e) => updateList('skills', i, 'proficiency', e.target.value)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            ))}
          </div>
        </section>

        {message ? <p className="jobs-message">{message}</p> : null}
        <button type="submit" className="jobs-apply-btn" disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
  )
}

export default JobSeekerProfile
