import { Link } from 'react-router-dom'
import logo from '../assets/logo.jpeg'
import SiteNav from '../components/SiteNav'
import './Hub.css'

function GetStartedHub() {
  return (
    <div className="landing hub-page">
      <SiteNav />
      <main className="hub-main">
        <header className="hub-intro">
          <img src={logo} alt="Work Mate" className="hub-logo" />
          <p className="hub-eyebrow">Work Mate Platform</p>
          <h1>Choose your workspace</h1>
          <p>
            Pick whether you are looking for a job, hiring talent, or creating content
            with AI — each workspace is tailored to what you need.
          </p>
        </header>

        <section className="hub-cards hub-cards-two">
          <article className="hub-card hub-card-jobs">
            <div className="hub-card-icon" aria-hidden="true">
              🔎
            </div>
            <h2>Job Search</h2>
            <p>
              Explore open roles as an employee, or post and manage listings as a recruiter
              from one streamlined workspace.
            </p>
            <ul>
              <li>Search and apply to open roles</li>
              <li>Track applications and review hiring activity</li>
              <li>Switch between employee and recruiter workflows</li>
            </ul>
            <div className="hub-card-actions">
              <Link to="/get-started/jobs" className="hub-btn hub-btn-employee">
                Employee page
                <span aria-hidden="true">→</span>
              </Link>
              <Link to="/get-started/jobs/recruiter/jobs" className="hub-btn hub-btn-recruiter">
                Recruiter page
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>

          <article className="hub-card hub-card-ai">
            <div className="hub-card-icon" aria-hidden="true">
              ✦
            </div>
            <h2>AI Tools</h2>
            <p>
              Create articles, blog titles, images, and polished resume content with
              our suite of AI-powered tools. Copy or download results anytime.
            </p>
            <ul>
              <li>AI Article Writer & Blog Title Generator</li>
              <li>Image generation & editing tools</li>
              <li>Resume reviewer with instant feedback</li>
            </ul>
            <Link to="/get-started/ai" className="hub-btn hub-btn-ai">
              Open AI Tools
              <span aria-hidden="true">→</span>
            </Link>
          </article>
        </section>
      </main>
    </div>
  )
}

export default GetStartedHub
