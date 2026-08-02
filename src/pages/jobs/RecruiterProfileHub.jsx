import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { fetchRecruiterApplications, fetchRecruiterJobs } from '../../services/jobsApi'
import { statusLabels } from './jobStatus'
import '../Jobs.css'

function RecruiterApplicationsPanel() {
  const [applications, setApplications] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [jobFilter, setJobFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchRecruiterJobs()
      .then((data) => setJobs(data.jobs || []))
      .catch(() => setJobs([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchRecruiterApplications({
      jobId: jobFilter !== 'all' ? jobFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    })
      .then((data) => setApplications(data.applications || []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false))
  }, [jobFilter, statusFilter])

  return (
    <div className="recruiter-apps-panel">
      <div className="recruiter-filters">
        <label>
          Job
          <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)}>
            <option value="all">All jobs</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="jobs-empty">Loading applications…</p>
      ) : applications.length === 0 ? (
        <div className="jobs-empty-state">
          <h3>No applications yet</h3>
          <p>When candidates apply to your jobs, they will appear here with full details.</p>
        </div>
      ) : (
        <ul className="applications-list">
          {applications.map((app) => (
            <li key={app.id}>
              <Link
                to={`/get-started/jobs/recruiter/applications/${app.id}`}
                className="application-card"
              >
                <div>
                  <h3>{app.applicantName}</h3>
                  <p>
                    {app.jobTitle} · {app.companyName}
                  </p>
                  <small>
                    {app.applicantHeadline || app.applicantEmail}
                    {app.applicantLocation ? ` · ${app.applicantLocation}` : ''}
                    {' · Applied '}
                    {new Date(app.appliedAt).toLocaleDateString()}
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

function RecruiterJobsPanel() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecruiterJobs()
      .then((data) => setJobs(data.jobs || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="jobs-empty">Loading jobs…</p>

  if (jobs.length === 0) {
    return (
      <div className="jobs-empty-state">
        <h3>No jobs posted yet</h3>
        <p>Create your first listing to start receiving applications.</p>
        <Link to="/get-started/jobs/recruiter/post" className="jobs-apply-btn inline">
          Post a job
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="recruiter-panel-actions">
        <Link to="/get-started/jobs/recruiter/post" className="jobs-apply-btn inline">
          + Post a job
        </Link>
      </div>
      <ul className="recruiter-jobs-list">
        {jobs.map((job) => (
          <li key={job.id}>
            <Link to={`/get-started/jobs/job/${job.id}`} className="recruiter-job-card">
              <div>
                <h3>{job.title}</h3>
                <p>
                  {job.company.name} · {job.location}
                </p>
                <span className={`job-status-pill status-${job.status}`}>{job.status}</span>
              </div>
              <div className="recruiter-job-meta">
                <strong>{job.applicationCount}</strong>
                <span>applications</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

function RecruiterProfileHub() {
  const location = useLocation()
  const path = location.pathname

  const isRecruiterProfileRoot = path === '/get-started/jobs/recruiter/profile'
  const activeTab =
    path.includes('/recruiter/applications') && !path.match(/applications\/\d+/)
      ? 'applications'
      : path.includes('/recruiter/jobs')
        ? 'jobs'
        : isRecruiterProfileRoot
          ? 'profile'
          : 'profile'

  return (
    <div className="jobs-panel profile-hub">
      <header className="jobs-panel-head jobs-recruiter-head">
        <div>
          <h1>Recruiter profile</h1>
          <p>
            Manage your company profile, posted jobs, and review candidate applications with
            status updates.
          </p>
        </div>
        <Link to="/get-started/jobs/recruiter/post" className="jobs-apply-btn">
          + Post a job
        </Link>
      </header>

      <nav className="profile-hub-tabs" aria-label="Recruiter profile sections">
        <NavLink
          to="/get-started/jobs/recruiter/profile"
          end
          className={() => (activeTab === 'profile' ? 'active' : '')}
        >
          Company profile
        </NavLink>
        <NavLink
          to="/get-started/jobs/recruiter/jobs"
          className={() => (activeTab === 'jobs' ? 'active' : '')}
        >
          Posted jobs
        </NavLink>
        <NavLink
          to="/get-started/jobs/recruiter/applications"
          className={() => (activeTab === 'applications' ? 'active' : '')}
        >
          Applications
        </NavLink>
      </nav>

      {activeTab === 'applications' && !path.match(/applications\/\d+/) ? (
        <RecruiterApplicationsPanel />
      ) : activeTab === 'jobs' ? (
        <RecruiterJobsPanel />
      ) : (
        <Outlet />
      )}
    </div>
  )
}

export default RecruiterProfileHub
