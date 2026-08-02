import { NavLink, Outlet, Link } from 'react-router-dom'
import logo from '../assets/logo.jpeg'
import { tools } from '../data/tools'
import { useAuth } from '../context/AuthContext'
import './Workspace.css'

function Workspace() {
  const { user } = useAuth()

  return (
    <div className="workspace">
      <aside className="workspace-sidebar">
        <Link to="/get-started" className="workspace-brand">
          <img src={logo} alt="Work Mate" />
          <span>Work Mate</span>
        </Link>

        <Link to="/get-started" className="workspace-hub-link">
          ← Hub
        </Link>

        <p className="workspace-label">AI Tools</p>
        <nav className="workspace-nav" aria-label="Tools">
          {tools.map((tool) => (
            <NavLink
              key={tool.slug}
              to={tool.path}
              className={({ isActive }) =>
                isActive ? 'workspace-link active' : 'workspace-link'
              }
            >
              <span className="workspace-link-icon" aria-hidden="true">
                {tool.icon}
              </span>
              <span>{tool.title}</span>
            </NavLink>
          ))}
        </nav>

        <div className="workspace-sidebar-footer">
          {user ? (
            <Link to="/profile" className="workspace-account">
              <span className="workspace-avatar" aria-hidden="true">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span>
                <strong>{user.name}</strong>
                <small>View profile</small>
              </span>
            </Link>
          ) : (
            <Link to="/login" className="workspace-account guest">
              Login to save work
            </Link>
          )}
        </div>
      </aside>

      <div className="workspace-main">
        <header className="workspace-topbar">
          <Link to="/" className="workspace-home">
            ← Home
          </Link>
          <div className="workspace-top-actions">
            <Link to="/get-started/ai" className="workspace-top-cta">
              AI Tools
              <span aria-hidden="true"> →</span>
            </Link>
            {user ? (
              <Link to="/profile" className="workspace-top-auth">
                Profile
              </Link>
            ) : (
              <Link to="/login" className="workspace-top-auth">
                Login
              </Link>
            )}
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  )
}

export default Workspace
