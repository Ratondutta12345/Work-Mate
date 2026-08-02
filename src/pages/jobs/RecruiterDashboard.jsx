import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchRecruiterJobs } from '../../services/jobsApi'
import '../Jobs.css'

function RecruiterDashboard() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecruiterJobs()
      .then((data) => setJobs(data.jobs || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false))
  }, [])

  const totalApplications = jobs.reduce((sum, job) => sum + (job.applicationCount || 0), 0)

  return (
    <div className="jobs-panel">
      <header className="jobs-panel-head jobs-recruiter-head">
        <div>
          <h1>For employers</h1>
          <p>Post jobs, manage listings, and review candidate applications on Work Mate.</p>
        </div>
        <Link to="/get-started/jobs/recruiter/post" className="jobs-apply-btn">
          + Post a job
        </Link>
      </header>

      <section className="recruiter-features">
        <article>
          <Link to="/get-started/jobs/recruiter/profile">
            <strong>Recruiter profile</strong>
          </Link>
          <p>Set up your company details and hiring preferences.</p>
        </article>
        <article>
          <Link to="/get-started/jobs/recruiter/jobs">
            <strong>Posted jobs</strong>
          </Link>
          <p>View and manage all your active job listings.</p>
        </article>
        <article>
          <Link to="/get-started/jobs/recruiter/applications">
            <strong>Applications</strong>
          </Link>
          <p>Review candidates, update status, and view full employee forms.</p>
        </article>
      </section>

      <div className="recruiter-stats-row">
        <div className="recruiter-stat">
          <strong>{jobs.length}</strong>
          <span>Posted jobs</span>
        </div>
        <div className="recruiter-stat">
          <strong>{totalApplications}</strong>
          <span>Total applications</span>
        </div>
      </div>

      <h2>Quick links</h2>
      <div className="recruiter-quick-links">
        <Link to="/get-started/jobs/recruiter/profile" className="jobs-apply-btn inline secondary">
          Edit recruiter profile
        </Link>
        <Link to="/get-started/jobs/recruiter/applications" className="jobs-apply-btn inline secondary">
          View all applications
        </Link>
      </div>
    </div>
  )
}

export default RecruiterDashboard
