import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMyApplications } from '../../services/jobsApi'
import { statusLabels } from './jobStatus'
import '../Jobs.css'

function MyApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyApplications()
      .then((data) => setApplications(data.applications || []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="jobs-panel">
      <header className="jobs-panel-head">
        <h1>My applications</h1>
        <p>Track every job you have applied to through Work Mate.</p>
      </header>

      {loading ? (
        <p className="jobs-empty">Loading applications…</p>
      ) : applications.length === 0 ? (
        <div className="jobs-empty-state">
          <h3>No applications yet</h3>
          <p>Search for jobs and apply — your history will appear here.</p>
          <Link to="/get-started/jobs" className="jobs-apply-btn inline">
            Find jobs
          </Link>
        </div>
      ) : (
        <ul className="applications-list">
          {applications.map((app) => (
            <li key={app.id}>
              <Link to={`/get-started/jobs/job/${app.jobId}`} className="application-card">
                <div>
                  <h3>{app.title}</h3>
                  <p>{app.companyName}</p>
                  <small>
                    {app.location} · Applied {new Date(app.appliedAt).toLocaleDateString()}
                  </small>
                </div>
                <span className={`app-status status-${app.status}`}>
                  {statusLabels[app.status] || app.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default MyApplications
