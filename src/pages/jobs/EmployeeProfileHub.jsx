import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { fetchMyApplications } from '../../services/jobsApi'
import { statusLabels } from './jobStatus'
import '../Jobs.css'

function EmployeeApplicationsPanel() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyApplications()
      .then((data) => setApplications(data.applications || []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="jobs-empty">Loading applications…</p>

  if (applications.length === 0) {
    return (
      <div className="jobs-empty-state">
        <h3>No applications yet</h3>
        <p>Search for jobs and apply — your history will appear here.</p>
        <Link to="/get-started/jobs" className="jobs-apply-btn inline">
          Find jobs
        </Link>
      </div>
    )
  }

  return (
    <ul className="applications-list">
      {applications.map((app) => (
        <li key={app.id}>
          <Link to={`/get-started/jobs/job/${app.jobId}`} className="application-card">
            <div>
              <h3>{app.title}</h3>
              <p>{app.companyName}</p>
              <small>
                {app.location} · Applied {new Date(app.appliedAt).toLocaleDateString()}
                {app.updatedAt && app.updatedAt !== app.appliedAt
                  ? ` · Updated ${new Date(app.updatedAt).toLocaleDateString()}`
                  : ''}
              </small>
            </div>
            <span className={`app-status status-${app.status}`}>
              {statusLabels[app.status] || app.status}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export { EmployeeApplicationsPanel }

function EmployeeProfileHub() {
  const location = useLocation()
  const isApplications = location.pathname.endsWith('/applications')

  return (
    <div className="jobs-panel profile-hub">
      <header className="jobs-panel-head">
        <h1>Employee profile</h1>
        <p>
          Manage your resume, skills, education, and track every job application in one place.
        </p>
      </header>

      <nav className="profile-hub-tabs" aria-label="Employee profile sections">
        <NavLink to="/get-started/jobs" className={({ isActive }) => (isActive ? 'active' : '')}>
          Find jobs
        </NavLink>
        <NavLink to="/get-started/jobs/profile" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Edit profile
        </NavLink>
        <NavLink
          to="/get-started/jobs/profile/applications"
          className={({ isActive }) => (isActive || isApplications ? 'active' : '')}
        >
          My applications
        </NavLink>
      </nav>

      <Outlet />
    </div>
  )
}

export default EmployeeProfileHub
