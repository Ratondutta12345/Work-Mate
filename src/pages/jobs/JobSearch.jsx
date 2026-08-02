import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { searchJobs, generateJobSearchSuggestions } from '../../services/jobsApi'
import '../Jobs.css'

function formatSalary(job) {
  if (!job.salaryMin && !job.salaryMax) return null
  const fmt = (n) => `$${Number(n).toLocaleString()}`
  if (job.salaryMin && job.salaryMax) return `${fmt(job.salaryMin)} – ${fmt(job.salaryMax)} / yr`
  if (job.salaryMin) return `From ${fmt(job.salaryMin)} / yr`
  return `Up to ${fmt(job.salaryMax)} / yr`
}

function JobSearch() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [location, setLocation] = useState(params.get('location') || '')
  const [jobType, setJobType] = useState(params.get('jobType') || 'all')
  const [jobs, setJobs] = useState([])
  const [total, setTotal] = useState(0)
  const [suggestions, setSuggestions] = useState([])
  const [tips, setTips] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingAi, setLoadingAi] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await searchJobs({
          q: params.get('q') || undefined,
          location: params.get('location') || undefined,
          jobType: params.get('jobType') !== 'all' ? params.get('jobType') : undefined,
        })
        setJobs(data.jobs || [])
        setTotal(data.total || 0)
      } catch {
        setJobs([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params])

  const handleSearch = (event) => {
    event.preventDefault()
    const next = new URLSearchParams()
    if (query.trim()) next.set('q', query.trim())
    if (location.trim()) next.set('location', location.trim())
    if (jobType !== 'all') next.set('jobType', jobType)
    setParams(next)
  }

  const handleGenerateSuggestions = async () => {
    setLoadingAi(true)
    setError(null)
    try {
      const data = await generateJobSearchSuggestions(query, location, jobType)
      setSuggestions(data.suggestions || [])
      setTips(data.tips || '')
    } catch (err) {
      setError(err.message || 'Failed to generate suggestions.')
    } finally {
      setLoadingAi(false)
    }
  }

  return (
    <div className="jobs-search-page">
      <section className="jobs-hero">
        <div className="jobs-hero-inner">
          <h1>Find your next role</h1>
          <p>Search jobs from top companies. Build your profile, apply in one click.</p>
          <form className="jobs-search-form" onSubmit={handleSearch}>
            <label>
              <span>What</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Job title, keywords, or company"
              />
            </label>
            <label>
              <span>Where</span>
              <input
                type="search"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, state, or remote"
              />
            </label>
            <button type="submit">Search</button>
          </form>
        </div>
      </section>

      <div className="jobs-content">
        <aside className="jobs-filters">
          <h3>Filter jobs</h3>
          <label>
            Job type
            <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
              <option value="all">All types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="remote">Remote</option>
              <option value="internship">Internship</option>
            </select>
          </label>
          <button
            type="button"
            className="jobs-filter-apply"
            onClick={() => {
              const next = new URLSearchParams(params)
              if (jobType !== 'all') next.set('jobType', jobType)
              else next.delete('jobType')
              setParams(next)
            }}
          >
            Apply filters
          </button>
          <button
            type="button"
            className="jobs-filter-ai"
            onClick={handleGenerateSuggestions}
            disabled={loadingAi}
          >
            {loadingAi ? 'Thinking…' : 'AI search tips'}
          </button>
          <div className="jobs-filter-tip">
            <strong>Job seeker?</strong>
            <p>
              Complete your profile with resume, skills, and education before applying.
            </p>
            <Link to="/get-started/jobs/profile">Employee profile →</Link>
          </div>
        </aside>

        <section className="jobs-results">
          <div className="jobs-results-head">
            <h2>
              {loading ? 'Searching…' : `${total} job${total === 1 ? '' : 's'} found`}
            </h2>
          </div>

          {error ? <div className="jobs-error">{error}</div> : null}

          {suggestions.length > 0 && (
            <section className="jobs-ai-suggestions">
              <h3>AI job search suggestions</h3>
              <ul>
                {suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
              {tips ? <p className="jobs-ai-tips">{tips}</p> : null}
            </section>
          )}

          {loading ? (
            <p className="jobs-empty">Loading jobs…</p>
          ) : jobs.length === 0 ? (
            <div className="jobs-empty-state">
              <h3>No jobs match your search</h3>
              <p>Try different keywords or broaden your location.</p>
            </div>
          ) : (
            <ul className="jobs-list">
              {jobs.map((job) => (
                <li key={job.id}>
                  <Link to={`/get-started/jobs/job/${job.id}`} className="job-card">
                    <div className="job-card-main">
                      <h3>{job.title}</h3>
                      <p className="job-company">{job.company.name}</p>
                      <p className="job-location">
                        {job.location || [job.city, job.state].filter(Boolean).join(', ')}
                        {job.isRemote ? ' · Remote' : ''}
                      </p>
                      <div className="job-tags">
                        <span>{job.jobType}</span>
                        <span>{job.experienceLevel}</span>
                        {formatSalary(job) ? <span>{formatSalary(job)}</span> : null}
                      </div>
                    </div>
                    <div className="job-card-side">
                      {job.applied ? <span className="job-applied-badge">Applied</span> : null}
                      {job.saved ? <span className="job-saved-badge">Saved</span> : null}
                      <span className="job-card-arrow">→</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

export default JobSearch
