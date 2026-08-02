import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.jpeg'
import SiteNav from '../components/SiteNav'
import { tools } from '../data/tools'
import './Landing.css'

const testimonials = [
  {
    quote:
      'PrebuiltUI helps me build clean and responsive interfaces faster without compromising design quality.',
    name: 'James Bond',
    company: 'Amazon.com, Inc.',
    date: 'Jun 10, 2026',
  },
  {
    quote:
      'These Tailwind components saved me countless hours while maintaining a polished and professional look.',
    name: 'Emily Rodriguez',
    company: 'The Walt Disney Company',
    date: 'Jun 10, 2026',
  },
  {
    quote:
      'PrebuiltUI makes frontend development faster, simpler and far more enjoyable for website projects.',
    name: 'Jack',
    company: 'Facebook, Inc.',
    date: 'Jun 10, 2026',
  },
]

function Landing() {
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  const prevTestimonial = () => {
    setActiveTestimonial((current) =>
      current === 0 ? testimonials.length - 1 : current - 1,
    )
  }

  const nextTestimonial = () => {
    setActiveTestimonial((current) =>
      current === testimonials.length - 1 ? 0 : current + 1,
    )
  }

  const testimonial = testimonials[activeTestimonial]

  return (
    <div className="landing">
      <SiteNav />

      <section className="hero">
        <div className="hero-backdrop" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-logo-wrap">
            <img src={logo} alt="Work Mate" className="hero-brand-logo" />
          </div>
          <p className="hero-brand-name">Work Mate</p>
          <h1>
            Create amazing content
            <span>with AI tools</span>
          </h1>
          <p className="hero-lead">
            Transform your content creation with our suite of premium AI tools.
            Write articles, generate images, and enhance your workflow.
          </p>
          <div className="hero-actions">
            <Link to="/get-started" className="btn btn-primary">
              Start Creating Now
            </Link>
            <a href="#tools" className="btn btn-ghost">
              Watch Demo
            </a>
          </div>
          <p className="hero-trust">Trusted by 10k+ people</p>
        </div>
      </section>

      <section id="tools" className="tools">
        <div className="section-intro">
          <h2>Powerful AI Tools</h2>
          <p>
            Everything you need to create, enhance, and optimize your content
            with cutting-edge AI technology.
          </p>
        </div>
        <div className="tools-grid">
          {tools.map((tool) => (
            <Link key={tool.path} to={tool.path} className="tool-link">
              <span className="tool-icon" aria-hidden="true">
                {tool.icon}
              </span>
              <h3>{tool.title}</h3>
              <p>{tool.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="jobs" className="jobs">
        <div className="section-intro">
          <h2>Jobs & Career Tools</h2>
          <p>
            Turn your AI workflow into real opportunities with smart job search,
            recruiter-ready applications, and polished profiles.
          </p>
        </div>

        <div className="jobs-grid">
          <article className="job-card">
            <div className="job-icon">💼</div>
            <div>
              <h3>Fast Job Search</h3>
              <p>
                Discover curated job listings and save time with intelligent
                role matching.
              </p>
            </div>
          </article>

          <article className="job-card">
            <div className="job-icon">📝</div>
            <div>
              <h3>Resume & Cover Letters</h3>
              <p>
                Improve your resume, cover letters, and applications with AI
                guidance tailored to each role.
              </p>
            </div>
          </article>

          <article className="job-card">
            <div className="job-icon">🤝</div>
            <div>
              <h3>Recruiter Ready</h3>
              <p>
                Create recruiter-friendly profiles and communicate your value more
                clearly to hiring teams.
              </p>
            </div>
          </article>
        </div>

        <div className="jobs-action">
          <Link to="/get-started/jobs" className="btn btn-primary">
            Explore Jobs
          </Link>
        </div>
      </section>

      <section className="testimonials">
        <div className="section-intro">
          <h2>Loved by 10k+ People</h2>
          <p>
            Every single testimonial is a testament to the profound impact we
            strive to create every single day.
          </p>
        </div>

        <div className="testimonial-stage">
          <button
            type="button"
            className="carousel-btn"
            onClick={prevTestimonial}
            aria-label="Previous testimonial"
          >
            ←
          </button>

          <article className="testimonial-card" key={activeTestimonial}>
            <div className="stars" aria-label="5 out of 5 stars">
              {'★★★★★'}
            </div>
            <blockquote>“{testimonial.quote}”</blockquote>
            <footer>
              <div className="avatar" aria-hidden="true">
                {testimonial.name.charAt(0)}
              </div>
              <div>
                <strong>{testimonial.name}</strong>
                <span>{testimonial.company}</span>
                <time>{testimonial.date}</time>
              </div>
            </footer>
          </article>

          <button
            type="button"
            className="carousel-btn"
            onClick={nextTestimonial}
            aria-label="Next testimonial"
          >
            →
          </button>
        </div>

        <div className="testimonial-dots" role="tablist">
          {testimonials.map((item, index) => (
            <button
              key={item.name}
              type="button"
              role="tab"
              aria-selected={index === activeTestimonial}
              aria-label={`Show testimonial from ${item.name}`}
              className={index === activeTestimonial ? 'active' : ''}
              onClick={() => setActiveTestimonial(index)}
            />
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <Link to="/" className="nav-brand">
          <img src={logo} alt="Work Mate" className="nav-logo" />
          <span>Work Mate</span>
        </Link>
        <p>Create amazing content with AI tools.</p>
      </footer>
    </div>
  )
}

export default Landing
