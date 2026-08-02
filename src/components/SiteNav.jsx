import { Link } from 'react-router-dom'
import logo from '../assets/logo.jpeg'
import { useAuth } from '../context/AuthContext'

function SiteNav() {
  const { user } = useAuth()

  return (
    <header className="landing-nav">
      <Link to="/" className="nav-brand">
        <img src={logo} alt="Work Mate" className="nav-logo" />
        <span>Work Mate</span>
      </Link>

      <div className="nav-end">
        <Link to="/get-started" className="nav-cta">
          Get Started
          <span className="nav-cta-arrow" aria-hidden="true">
            →
          </span>
        </Link>
        {user ? (
          <Link to="/profile" className="nav-auth">
            Profile
          </Link>
        ) : (
          <Link to="/login" className="nav-auth">
            Login
          </Link>
        )}
      </div>
    </header>
  )
}

export default SiteNav
