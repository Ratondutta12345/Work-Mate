import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { postJob } from '../../services/jobsApi'
import '../Jobs.css'

function PostJob() {
  const navigate = useNavigate()
  const { user, ready } = useAuth()
  const [form, setForm] = useState({
    companyName: '',
    companyWebsite: '',
    companyDescription: '',
    industry: '',
    companySize: '',
    headquarters: '',
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    jobType: 'full-time',
    experienceLevel: 'mid',
    salaryMin: '',
    salaryMax: '',
    location: '',
    city: '',
    state: '',
    country: 'USA',
    isRemote: false,
    recruiterTitle: 'Recruiter',
    phone: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const data = await postJob({
        ...form,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
      })
      navigate(`/get-started/jobs/recruiter/jobs`)
    } catch (err) {
      setError(err.message || 'Could not post job.')
    } finally {
      setSaving(false)
    }
  }

  if (!ready) return <div className="jobs-panel"><p>Loading…</p></div>
  if (!user) return <Navigate to="/login" replace state={{ from: '/get-started/jobs/recruiter/post' }} />

  return (
    <div className="jobs-panel">
      <Link to="/get-started/jobs/recruiter/profile" className="jobs-back">← Back to recruiter profile</Link>
      <header className="jobs-panel-head">
        <h1>Post a new job</h1>
        <p>Fill in the details below to publish your listing.</p>
      </header>

      <form className="profile-form post-job-form" onSubmit={handleSubmit}>
        <section>
          <h2>Company</h2>
          <div className="form-grid">
            <label>Company name *<input required value={form.companyName} onChange={(e) => update('companyName', e.target.value)} /></label>
            <label>Website<input value={form.companyWebsite} onChange={(e) => update('companyWebsite', e.target.value)} /></label>
            <label>Industry<input value={form.industry} onChange={(e) => update('industry', e.target.value)} /></label>
            <label>Company size<input value={form.companySize} onChange={(e) => update('companySize', e.target.value)} placeholder="51-200" /></label>
            <label>Headquarters<input value={form.headquarters} onChange={(e) => update('headquarters', e.target.value)} /></label>
          </div>
          <label>Company description<textarea rows={3} value={form.companyDescription} onChange={(e) => update('companyDescription', e.target.value)} /></label>
        </section>

        <section>
          <h2>Job details</h2>
          <div className="form-grid">
            <label>Job title *<input required value={form.title} onChange={(e) => update('title', e.target.value)} /></label>
            <label>Job type
              <select value={form.jobType} onChange={(e) => update('jobType', e.target.value)}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="remote">Remote</option>
              </select>
            </label>
            <label>Experience level
              <select value={form.experienceLevel} onChange={(e) => update('experienceLevel', e.target.value)}>
                <option value="entry">Entry level</option>
                <option value="mid">Mid level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
                <option value="executive">Executive</option>
              </select>
            </label>
            <label>Salary min<input type="number" value={form.salaryMin} onChange={(e) => update('salaryMin', e.target.value)} /></label>
            <label>Salary max<input type="number" value={form.salaryMax} onChange={(e) => update('salaryMax', e.target.value)} /></label>
            <label>Location<input value={form.location} onChange={(e) => update('location', e.target.value)} /></label>
            <label>City<input value={form.city} onChange={(e) => update('city', e.target.value)} /></label>
            <label>State<input value={form.state} onChange={(e) => update('state', e.target.value)} /></label>
            <label className="checkbox-label">
              <input type="checkbox" checked={form.isRemote} onChange={(e) => update('isRemote', e.target.checked)} />
              Remote position
            </label>
          </div>
          <label>Job description *<textarea required rows={5} value={form.description} onChange={(e) => update('description', e.target.value)} /></label>
          <label>Requirements<textarea rows={4} value={form.requirements} onChange={(e) => update('requirements', e.target.value)} /></label>
          <label>Responsibilities<textarea rows={4} value={form.responsibilities} onChange={(e) => update('responsibilities', e.target.value)} /></label>
        </section>

        {error ? <p className="jobs-error">{error}</p> : null}
        <button type="submit" className="jobs-apply-btn" disabled={saving}>
          {saving ? 'Publishing…' : 'Publish job'}
        </button>
      </form>
    </div>
  )
}

export default PostJob
