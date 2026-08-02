import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchRecruiterProfile, saveRecruiterProfile } from '../../services/jobsApi'
import '../Jobs.css'

const emptyCompany = () => ({
  name: '',
  website: '',
  description: '',
  industry: '',
  companySize: '',
  headquarters: '',
  logoUrl: '',
})

function RecruiterProfileForm() {
  const { user, ready } = useAuth()
  const [form, setForm] = useState({
    jobTitle: '',
    phone: '',
    department: '',
    bio: '',
    linkedinUrl: '',
    notificationEmail: '',
    company: emptyCompany(),
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchRecruiterProfile()
      .then((data) => {
        if (data.profile) {
          setForm({
            jobTitle: data.profile.jobTitle || '',
            phone: data.profile.phone || '',
            department: data.profile.department || '',
            bio: data.profile.bio || '',
            linkedinUrl: data.profile.linkedinUrl || '',
            notificationEmail: data.profile.notificationEmail || '',
            company: data.profile.company
              ? { ...emptyCompany(), ...data.profile.company }
              : emptyCompany(),
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  const updateCompany = (key, value) =>
    setForm((f) => ({ ...f, company: { ...f.company, [key]: value } }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await saveRecruiterProfile(form)
      setMessage('Recruiter profile saved successfully.')
    } catch (err) {
      setMessage(err.message || 'Could not save profile.')
    } finally {
      setSaving(false)
    }
  }

  if (!ready) return <p className="jobs-empty">Loading…</p>
  if (!user) return <Navigate to="/login" replace state={{ from: '/get-started/jobs/recruiter/profile' }} />

  if (loading) return <p className="jobs-empty">Loading profile…</p>

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <section>
        <h2>Recruiter details</h2>
        <div className="form-grid">
          <label>
            Your job title
            <input
              value={form.jobTitle}
              onChange={(e) => update('jobTitle', e.target.value)}
              placeholder="e.g. Talent Acquisition Manager"
            />
          </label>
          <label>
            Department
            <input
              value={form.department}
              onChange={(e) => update('department', e.target.value)}
              placeholder="e.g. Human Resources"
            />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </label>
          <label>
            LinkedIn URL
            <input value={form.linkedinUrl} onChange={(e) => update('linkedinUrl', e.target.value)} />
          </label>
          <label>
            Notification email
            <input
              value={form.notificationEmail}
              onChange={(e) => update('notificationEmail', e.target.value)}
              placeholder="Applications sent here"
            />
          </label>
        </div>
        <label>
          Bio
          <textarea
            rows={3}
            value={form.bio}
            onChange={(e) => update('bio', e.target.value)}
            placeholder="Brief introduction for candidates…"
          />
        </label>
      </section>

      <section>
        <h2>Company information</h2>
        <div className="form-grid">
          <label>
            Company name
            <input
              value={form.company.name}
              onChange={(e) => updateCompany('name', e.target.value)}
              required
            />
          </label>
          <label>
            Website
            <input
              value={form.company.website}
              onChange={(e) => updateCompany('website', e.target.value)}
            />
          </label>
          <label>
            Industry
            <input
              value={form.company.industry}
              onChange={(e) => updateCompany('industry', e.target.value)}
            />
          </label>
          <label>
            Company size
            <select
              value={form.company.companySize}
              onChange={(e) => updateCompany('companySize', e.target.value)}
            >
              <option value="">Select</option>
              <option value="1-10">1–10</option>
              <option value="11-50">11–50</option>
              <option value="51-200">51–200</option>
              <option value="201-500">201–500</option>
              <option value="501-1000">501–1,000</option>
              <option value="1001-5000">1,001–5,000</option>
              <option value="5001-10000">5,001–10,000</option>
              <option value="10000+">10,000+</option>
            </select>
          </label>
          <label>
            Headquarters
            <input
              value={form.company.headquarters}
              onChange={(e) => updateCompany('headquarters', e.target.value)}
            />
          </label>
          <label>
            Logo URL
            <input
              value={form.company.logoUrl}
              onChange={(e) => updateCompany('logoUrl', e.target.value)}
            />
          </label>
        </div>
        <label>
          Company description
          <textarea
            rows={4}
            value={form.company.description}
            onChange={(e) => updateCompany('description', e.target.value)}
            placeholder="Tell candidates about your company culture and mission…"
          />
        </label>
      </section>

      {message ? <p className="jobs-message">{message}</p> : null}
      <button type="submit" className="jobs-apply-btn" disabled={saving}>
        {saving ? 'Saving…' : 'Save recruiter profile'}
      </button>
    </form>
  )
}

export default RecruiterProfileForm
