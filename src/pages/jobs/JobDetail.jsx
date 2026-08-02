import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  applyToJob,
  fetchJobListing,
  generateCoverLetter,
  generateInterviewPrep,
  saveJobListing,
  unsaveJobListing,
} from '../../services/jobsApi'
import '../Jobs.css'

function JobDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [autoCoverLetter, setAutoCoverLetter] = useState('')
  const [interviewPrep, setInterviewPrep] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [loadingAi, setLoadingAi] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchJobListing(id)
      .then((data) => setJob(data.job))
      .catch(() => setJob(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleApply = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    setApplying(true)
    setMessage('')
    try {
      await applyToJob(id, coverLetter)
      setMessage('Application submitted successfully!')
      const data = await fetchJobListing(id)
      setJob(data.job)
    } catch (err) {
      setMessage(err.message || 'Could not apply.')
    } finally {
      setApplying(false)
    }
  }

  const handleGenerateCoverLetter = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    setLoadingAi(true)
    setMessage('')
    try {
      const data = await generateCoverLetter(id)
      setAutoCoverLetter(data.coverLetter || '')
      if (!data.coverLetter) {
        setMessage('AI returned no cover letter.')
      }
    } catch (err) {
      setMessage(err.message || 'Failed to generate cover letter.')
    } finally {
      setLoadingAi(false)
    }
  }

  const handleGenerateInterviewPrep = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    setLoadingAi(true)
    setMessage('')
    try {
      const data = await generateInterviewPrep(id)
      setInterviewPrep({
        questions: data.questions || [],
        answers: data.answers || [],
        tips: data.tips || '',
      })
      if (!data.questions?.length) {
        setMessage('AI returned no interview questions.')
      }
    } catch (err) {
      setMessage(err.message || 'Failed to generate interview prep.')
    } finally {
      setLoadingAi(false)
    }
  }

  const handleSave = async () => {
    if (!user) return navigate('/login')
    try {
      if (job.saved) await unsaveJobListing(id)
      else await saveJobListing(id)
      const data = await fetchJobListing(id)
      setJob(data.job)
    } catch {
      setMessage('Could not update saved status.')
    }
  }

  if (loading) return <div className="jobs-panel"><p>Loading job…</p></div>
  if (!job) return <div className="jobs-panel"><p>Job not found.</p></div>

  const salary =
    job.salaryMin && job.salaryMax
      ? `$${job.salaryMin.toLocaleString()} – $${job.salaryMax.toLocaleString()} / year`
      : null

  return (
    <div className="jobs-detail-page">
      <div className="jobs-panel">
        <Link to="/get-started/jobs" className="jobs-back">
          ← Back to search
        </Link>
        <header className="jobs-detail-head">
          <div>
            <h1>{job.title}</h1>
            <p className="job-company-lg">{job.company.name}</p>
            <p className="job-location-lg">
              {job.location}
              {job.isRemote ? ' · Remote' : ''}
            </p>
            <div className="job-tags">
              <span>{job.jobType}</span>
              <span>{job.experienceLevel}</span>
              {salary ? <span>{salary}</span> : null}
            </div>
          </div>
          <div className="jobs-detail-actions">
            {job.applied ? (
              <span className="job-applied-badge lg">Applied</span>
            ) : (
              <button type="button" className="jobs-apply-btn" onClick={handleApply} disabled={applying}>
                {applying ? 'Applying…' : 'Apply now'}
              </button>
            )}
            <button type="button" className="jobs-save-btn" onClick={handleSave}>
              {job.saved ? 'Unsave' : 'Save job'}
            </button>
          </div>
        </header>

        {message ? <p className="jobs-message">{message}</p> : null}

        {!job.applied && user ? (
          <div className="jobs-apply-box">
            <label htmlFor="cover">Cover letter (optional)</label>
            <textarea
              id="cover"
              rows={4}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Tell the employer why you're a great fit…"
            />
            <div className="jobs-ai-actions">
              <button
                type="button"
                className="jobs-ai-button"
                onClick={handleGenerateCoverLetter}
                disabled={loadingAi}
              >
                {loadingAi ? 'Generating cover letter…' : 'Generate cover letter'}
              </button>
              <button
                type="button"
                className="jobs-ai-button"
                onClick={handleGenerateInterviewPrep}
                disabled={loadingAi}
              >
                {loadingAi ? 'Generating interview prep…' : 'Generate interview prep'}
              </button>
            </div>
            {autoCoverLetter ? (
              <section className="jobs-ai-output">
                <h3>AI cover letter</h3>
                <pre className="jobs-pre">{autoCoverLetter}</pre>
                <button type="button" className="jobs-apply-btn" onClick={() => setCoverLetter(autoCoverLetter)}>
                  Use this letter
                </button>
              </section>
            ) : null}
            {interviewPrep?.questions?.length ? (
              <section className="jobs-ai-output">
                <h3>Interview prep</h3>
                <div className="jobs-ai-prep">
                  <div>
                    <h4>Questions</h4>
                    <ol>
                      {interviewPrep.questions.map((question, index) => (
                        <li key={`q-${index}`}>{question}</li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <h4>Sample answers</h4>
                    <ol>
                      {interviewPrep.answers?.map((answer, index) => (
                        <li key={`a-${index}`}>{answer}</li>
                      ))}
                    </ol>
                  </div>
                </div>
                {interviewPrep.tips ? <p className="jobs-ai-tips">{interviewPrep.tips}</p> : null}
              </section>
            ) : null}
          </div>
        ) : null}

        <section className="jobs-detail-section">
          <h2>Job details</h2>
          <pre className="jobs-pre">{job.description}</pre>
        </section>
        {job.responsibilities ? (
          <section className="jobs-detail-section">
            <h2>Responsibilities</h2>
            <pre className="jobs-pre">{job.responsibilities}</pre>
          </section>
        ) : null}
        {job.requirements ? (
          <section className="jobs-detail-section">
            <h2>Requirements</h2>
            <pre className="jobs-pre">{job.requirements}</pre>
          </section>
        ) : null}
        {job.company.description ? (
          <section className="jobs-detail-section">
            <h2>About {job.company.name}</h2>
            <pre className="jobs-pre">{job.company.description}</pre>
          </section>
        ) : null}
      </div>
    </div>
  )
}

export default JobDetail
