import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  fetchRecruiterApplication,
  updateApplicationStatus,
} from '../../services/jobsApi'
import { statusLabels, statusOptions } from './jobStatus'
import '../Jobs.css'

function ProfileSection({ title, children }) {
  if (!children) return null
  return (
    <section className="applicant-section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function RecruiterApplicationDetail() {
  const { appId } = useParams()
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('applied')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const load = () => {
    setLoading(true)
    fetchRecruiterApplication(appId)
      .then((data) => {
        setApplication(data.application)
        setStatus(data.application.status)
      })
      .catch(() => setApplication(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [appId])

  const handleStatusUpdate = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await updateApplicationStatus(appId, status, note || null)
      setMessage('Application status updated.')
      setNote('')
      load()
    } catch (err) {
      setMessage(err.message || 'Could not update status.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="jobs-panel">
        <p className="jobs-empty">Loading application…</p>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="jobs-panel">
        <p className="jobs-error">Application not found.</p>
        <Link to="/get-started/jobs/recruiter/applications" className="jobs-back">
          ← Back to applications
        </Link>
      </div>
    )
  }

  const profile = application.liveProfile || application.resumeSnapshot || {}
  const applicant = application.applicant

  return (
    <div className="jobs-panel applicant-detail">
      <Link to="/get-started/jobs/recruiter/applications" className="jobs-back">
        ← Back to applications
      </Link>

      <header className="applicant-head">
        <div>
          <h1>{applicant.name}</h1>
          <p className="applicant-meta">
            {profile.headline || applicant.email}
            {profile.location ? ` · ${profile.location}` : ''}
          </p>
          <p className="applicant-job">
            Applied for <strong>{application.job.title}</strong> at {application.job.companyName}
          </p>
          <small>
            Applied {new Date(application.appliedAt).toLocaleDateString()} · Current status:{' '}
            <span className={`app-status status-${application.status}`}>
              {statusLabels[application.status]}
            </span>
          </small>
        </div>
      </header>

      <div className="applicant-layout">
        <div className="applicant-main">
          {application.coverLetter ? (
            <ProfileSection title="Cover letter">
              <p className="jobs-pre">{application.coverLetter}</p>
            </ProfileSection>
          ) : null}

          {profile.summary ? (
            <ProfileSection title="Professional summary">
              <p className="jobs-pre">{profile.summary}</p>
            </ProfileSection>
          ) : null}

          {profile.resumeText ? (
            <ProfileSection title="Resume">
              <p className="jobs-pre">{profile.resumeText}</p>
              {profile.resumeFileName ? (
                <p className="resume-file-tag">
                  Attached: {profile.resumeFileName}
                  {profile.resumeFileUrl ? (
                    <>
                      {' '}
                      · <a href={profile.resumeFileUrl} target="_blank" rel="noreferrer">View file</a>
                    </>
                  ) : null}
                </p>
              ) : null}
            </ProfileSection>
          ) : null}

          {profile.experience?.length ? (
            <ProfileSection title="Work experience">
              <ul className="applicant-list">
                {profile.experience.map((exp, i) => (
                  <li key={i}>
                    <strong>{exp.title}</strong> at {exp.company}
                    {exp.location ? ` · ${exp.location}` : ''}
                    <br />
                    <small>
                      {exp.startDate ? new Date(exp.startDate).toLocaleDateString() : '—'}
                      {' – '}
                      {exp.isCurrent ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString() : '—'}
                    </small>
                    {exp.description ? <p className="jobs-pre">{exp.description}</p> : null}
                  </li>
                ))}
              </ul>
            </ProfileSection>
          ) : null}

          {profile.education?.length ? (
            <ProfileSection title="Education">
              <ul className="applicant-list">
                {profile.education.map((ed, i) => (
                  <li key={i}>
                    <strong>{ed.school}</strong>
                    {ed.degree ? ` · ${ed.degree}` : ''}
                    {ed.fieldOfStudy ? ` in ${ed.fieldOfStudy}` : ''}
                    {ed.grade ? ` · ${ed.grade}` : ''}
                  </li>
                ))}
              </ul>
            </ProfileSection>
          ) : null}

          {profile.skills?.length ? (
            <ProfileSection title="Skills">
              <div className="applicant-skills">
                {profile.skills.map((sk, i) => (
                  <span key={i} className="skill-pill">
                    {sk.skillName || sk.skill_name}
                    {sk.proficiency && sk.proficiency !== 'intermediate' ? ` (${sk.proficiency})` : ''}
                  </span>
                ))}
              </div>
            </ProfileSection>
          ) : null}

          <ProfileSection title="Contact">
            <ul className="applicant-contact">
              <li>Email: {applicant.email}</li>
              {profile.phone ? <li>Phone: {profile.phone}</li> : null}
              {profile.linkedinUrl ? (
                <li>
                  LinkedIn:{' '}
                  <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">
                    {profile.linkedinUrl}
                  </a>
                </li>
              ) : null}
              {profile.desiredSalary ? <li>Desired salary: {profile.desiredSalary}</li> : null}
            </ul>
          </ProfileSection>
        </div>

        <aside className="applicant-sidebar">
          <form className="status-update-box" onSubmit={handleStatusUpdate}>
            <h2>Update status</h2>
            <label>
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Note (optional)
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note about this status change…"
              />
            </label>
            {message ? <p className="jobs-message">{message}</p> : null}
            <button type="submit" className="jobs-apply-btn" disabled={saving}>
              {saving ? 'Saving…' : 'Update status'}
            </button>
          </form>

          {application.statusHistory?.length ? (
            <section className="status-history">
              <h2>Status history</h2>
              <ol className="status-timeline">
                {application.statusHistory.map((entry) => (
                  <li key={entry.id}>
                    <strong>{statusLabels[entry.newStatus] || entry.newStatus}</strong>
                    <small>
                      {new Date(entry.createdAt).toLocaleString()}
                      {entry.changedByName ? ` · ${entry.changedByName}` : ''}
                    </small>
                    {entry.note ? <p>{entry.note}</p> : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

export default RecruiterApplicationDetail
