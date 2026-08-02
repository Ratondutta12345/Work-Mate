import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import SiteNav from '../components/SiteNav'
import { useAuth } from '../context/AuthContext'
import {
  deleteJob,
  fetchDashboardHistory,
  fetchDashboardOverview,
  saveJob,
  unsaveJob,
} from '../services/authApi'
import { fetchMyApplications } from '../services/jobsApi'
import './Landing.css'
import './Auth.css'
import './Dashboard.css'

const filters = [
  { id: 'all', label: 'All jobs' },
  { id: 'writing', label: 'Articles & Titles' },
  { id: 'image', label: 'Image tools' },
  { id: 'resume', label: 'Resume' },
]

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function previewText(text, max = 140) {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim()
  if (!cleaned) return 'No preview'
  return cleaned.length > max ? `${cleaned.slice(0, max - 3)}...` : cleaned
}

function Profile() {
  const { user, logout, ready } = useAuth()
  const navigate = useNavigate()
  const [overview, setOverview] = useState(null)
  const [history, setHistory] = useState([])
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [activeTab, setActiveTab] = useState('ai')
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionNote, setActionNote] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [overviewData, historyData, appsData] = await Promise.all([
        fetchDashboardOverview(),
        fetchDashboardHistory({
          category: filter === 'all' ? undefined : filter,
          q: search || undefined,
        }),
        fetchMyApplications().catch(() => ({ applications: [] })),
      ])
      setOverview(overviewData)
      setHistory(historyData.runs || [])
      setTotal(historyData.total || 0)
      setApplications(appsData.applications || [])
    } catch (err) {
      setError(err.message || 'Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => {
    if (!user) return undefined
    const timer = window.setTimeout(() => {
      loadDashboard()
    }, search ? 250 : 0)
    return () => window.clearTimeout(timer)
  }, [user, loadDashboard, search])

  const providerLabel = useMemo(() => {
    if (!user) return ''
    if (user.provider === 'x') return 'X / Twitter'
    if (user.provider === 'email') return 'Email'
    return user.provider
  }, [user])

  if (!ready) return null
  if (!user) return <Navigate to="/login" replace />

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setActionNote('Copied to clipboard')
    } catch {
      setActionNote('Could not copy')
    }
  }

  const handleDownload = (job) => {
    const blob = new Blob([job.output], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `workmate-${job.slug}-${job.id}.txt`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setActionNote('Download started')
  }

  const handleToggleSave = async (job) => {
    try {
      if (job.saved) {
        await unsaveJob(job.id)
      } else {
        await saveJob(job.id)
      }
      await loadDashboard()
      if (selected?.id === job.id) {
        setSelected({ ...job, saved: !job.saved })
      }
      setActionNote(job.saved ? 'Removed from saved' : 'Saved to profile')
    } catch (err) {
      setActionNote(err.message || 'Could not update saved job')
    }
  }

  const handleDelete = async (job) => {
    const ok = window.confirm('Delete this job from your history?')
    if (!ok) return
    try {
      await deleteJob(job.id)
      if (selected?.id === job.id) setSelected(null)
      await loadDashboard()
      setActionNote('Job deleted')
    } catch (err) {
      setActionNote(err.message || 'Could not delete job')
    }
  }

  const stats = overview?.overview || {
    totalJobs: 0,
    writingJobs: 0,
    imageJobs: 0,
    resumeJobs: 0,
    todayJobs: 0,
  }

  return (
    <div className="landing dashboard-page">
      <SiteNav />
      <main className="dashboard">
        <header className="dashboard-hero">
          <div className="dashboard-user">
            <div className="dashboard-avatar" aria-hidden="true">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="dashboard-eyebrow">Profile dashboard</p>
              <h1>{user.name}</h1>
              <p>{user.email}</p>
              <span className="profile-provider">Signed in with {providerLabel}</span>
            </div>
          </div>
          <div className="dashboard-hero-actions">
            <Link to="/get-started" className="btn btn-primary">
              Start a new job →
            </Link>
            <button type="button" className="btn btn-ghost" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <section className="dashboard-stats" aria-label="Activity counts">
          <article>
            <span>AI jobs</span>
            <strong>{stats.totalJobs}</strong>
          </article>
          <article>
            <span>Applications</span>
            <strong>{applications.length}</strong>
          </article>
          <article>
            <span>Today</span>
            <strong>{stats.todayJobs}</strong>
          </article>
          <article>
            <span>Writing</span>
            <strong>{stats.writingJobs}</strong>
          </article>
          <article>
            <span>Images</span>
            <strong>{stats.imageJobs}</strong>
          </article>
        </section>

        <div className="dashboard-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ai'}
            className={activeTab === 'ai' ? 'active' : ''}
            onClick={() => setActiveTab('ai')}
          >
            AI tool history
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'jobs'}
            className={activeTab === 'jobs' ? 'active' : ''}
            onClick={() => setActiveTab('jobs')}
          >
            Job applications ({applications.length})
          </button>
        </div>

        {activeTab === 'jobs' ? (
          <section className="dashboard-panel history-panel">
            <div className="dashboard-panel-head">
              <h2>Job application history</h2>
              <p>Every role you applied to through Work Mate Jobs.</p>
            </div>
            {applications.length === 0 ? (
              <div className="dashboard-empty-state">
                <h3>No applications yet</h3>
                <p>Search jobs and apply — your history will show here.</p>
                <Link to="/get-started/jobs" className="btn btn-primary">
                  Find jobs
                </Link>
              </div>
            ) : (
              <ul className="applications-list profile-apps">
                {applications.map((app) => (
                  <li key={app.id}>
                    <Link to={`/get-started/jobs/job/${app.jobId}`} className="application-card">
                      <div>
                        <h3>{app.title}</h3>
                        <p>{app.companyName}</p>
                        <small>
                          {app.location} · Applied{' '}
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </small>
                      </div>
                      <span className={`app-status status-${app.status}`}>
                        {app.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <>
        <section className="dashboard-split">
          <div className="dashboard-panel">
            <div className="dashboard-panel-head">
              <h2>Tools overview</h2>
              <p>Counts for every job type you have run.</p>
            </div>
            <div className="tool-count-grid">
              {(overview?.byTool || []).map((tool) => (
                <Link
                  key={tool.slug}
                  to={`/get-started/ai/${tool.slug}`}
                  className="tool-count-card"
                >
                  <span className="tool-count-icon" aria-hidden="true">
                    {tool.icon}
                  </span>
                  <div>
                    <strong>{tool.title}</strong>
                    <small>{tool.category}</small>
                  </div>
                  <em>{tool.count}</em>
                </Link>
              ))}
            </div>
          </div>

          <div className="dashboard-panel">
            <div className="dashboard-panel-head">
              <h2>Quick actions</h2>
              <p>Jump back into creating content.</p>
            </div>
            <div className="quick-actions">
              <Link to="/get-started/ai/article-writer">Write an article</Link>
              <Link to="/get-started/ai/title-generator">Generate blog titles</Link>
              <Link to="/get-started/ai/image-generation">Create an image</Link>
              <Link to="/get-started/ai/background-removal">Remove a background</Link>
              <Link to="/get-started/ai/object-removal">Remove an object</Link>
              <Link to="/get-started/ai/resume-reviewer">Review a resume</Link>
            </div>
          </div>
        </section>

        <section className="dashboard-panel history-panel">
          <div className="dashboard-panel-head history-head">
            <div>
              <h2>Job history</h2>
              <p>
                Revisit articles, blog titles, image work, resume reviews, and every
                other job you have completed. {total} result{total === 1 ? '' : 's'} found.
              </p>
            </div>
            <div className="history-controls">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search your jobs..."
              />
              <div className="history-filters" role="tablist">
                {filters.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={filter === item.id}
                    className={filter === item.id ? 'active' : ''}
                    onClick={() => setFilter(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error ? <p className="dashboard-error">{error}</p> : null}
          {actionNote ? <p className="dashboard-note">{actionNote}</p> : null}

          {loading ? (
            <p className="dashboard-empty">Loading your dashboard...</p>
          ) : history.length === 0 ? (
            <div className="dashboard-empty-state">
              <h3>No jobs yet</h3>
              <p>Run a tool from Get Started and it will appear here for later.</p>
              <Link to="/get-started" className="btn btn-primary">
                Open tools
              </Link>
            </div>
          ) : (
            <div className="history-layout">
              <ul className="history-list">
                {history.map((job) => (
                  <li key={job.id}>
                    <button
                      type="button"
                      className={
                        selected?.id === job.id
                          ? 'history-item active'
                          : 'history-item'
                      }
                      onClick={() => {
                        setSelected(job)
                        setActionNote('')
                      }}
                    >
                      <span className="history-icon" aria-hidden="true">
                        {job.icon}
                      </span>
                      <span className="history-copy">
                        <strong>{job.title || job.toolTitle}</strong>
                        <small>
                          {job.toolTitle} · {formatDate(job.createdAt)}
                        </small>
                        <em>{previewText(job.output)}</em>
                      </span>
                      <span className="history-badge">{job.category}</span>
                    </button>
                  </li>
                ))}
              </ul>

              <aside className="history-detail">
                {selected ? (
                  <>
                    <div className="history-detail-head">
                      <p className="dashboard-eyebrow">
                        {selected.icon} {selected.toolTitle}
                      </p>
                      <h3>{selected.title || selected.toolTitle}</h3>
                      <p>{formatDate(selected.createdAt)}</p>
                    </div>

                    <div className="history-detail-actions">
                      {selected.resultAction === 'copy' ? (
                        <button
                          type="button"
                          className="tool-action-btn"
                          onClick={() => handleCopy(selected.output)}
                        >
                          Copy result
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="tool-action-btn"
                          onClick={() => handleDownload(selected)}
                        >
                          Download
                        </button>
                      )}
                      <button
                        type="button"
                        className="tool-action-btn"
                        onClick={() => handleToggleSave(selected)}
                      >
                        {selected.saved ? 'Unsave' : 'Save'}
                      </button>
                      <Link
                        to={`/get-started/ai/${selected.slug}`}
                        className="tool-action-btn"
                      >
                        Run again
                      </Link>
                      <button
                        type="button"
                        className="tool-action-btn danger"
                        onClick={() => handleDelete(selected)}
                      >
                        Delete
                      </button>
                    </div>

                    <div className="history-block">
                      <h4>Input</h4>
                      <pre>{selected.input}</pre>
                    </div>
                    <div className="history-block">
                      <h4>Output</h4>
                      <pre>{selected.output}</pre>
                    </div>
                  </>
                ) : (
                  <div className="dashboard-empty-state compact">
                    <h3>Select a job</h3>
                    <p>Choose any history item to view the full input and result.</p>
                  </div>
                )}
              </aside>
            </div>
          )}
        </section>
          </>
        )}
      </main>
    </div>
  )
}

export default Profile
