import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import logo from '../../assets/logo.jpeg'
import { useAuth } from '../../context/AuthContext'
import '../Jobs.css'

function JobsLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const isRecruiter = location.pathname.includes('/recruiter')
  const brandTo = isRecruiter ? '/get-started/jobs/recruiter/jobs' : '/get-started/jobs'
  const profileDestination = isRecruiter ? '/get-started/jobs/recruiter/jobs' : '/get-started/jobs/profile'
  const showProfileButton = !isRecruiter

  return (
    <div className="jobs-app">
      <header className="jobs-header">
        <div className="jobs-header-inner">
          <Link to={brandTo} className="jobs-brand">
            <img src={logo} alt="" />
            <span>
              Work<span className="jobs-brand-accent">Mate</span> Jobs
            </span>
          </Link>
          <div className="jobs-header-actions">
            <Link to="/get-started" className="jobs-link-muted">
              ← Hub
            </Link>
            {user ? (
              showProfileButton ? (
                <Link to={profileDestination} className="jobs-profile-btn">
                  Profile
                </Link>
              ) : null
            ) : (
              <Link to="/login" className="jobs-profile-btn">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  )
}

export default JobsLayout
