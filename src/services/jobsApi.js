import { apiRequest } from './api'

export async function searchJobs({ q, location, jobType, limit, offset } = {}) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (location) params.set('location', location)
  if (jobType) params.set('jobType', jobType)
  if (limit) params.set('limit', String(limit))
  if (offset) params.set('offset', String(offset))
  const query = params.toString()
  return apiRequest(`/api/jobs/search${query ? `?${query}` : ''}`)
}

export async function fetchJobListing(id) {
  return apiRequest(`/api/jobs/${id}`)
}

export async function generateJobSearchSuggestions(query, location, jobType, profileSummary) {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  if (location) params.set('location', location)
  if (jobType) params.set('jobType', jobType)
  if (profileSummary) params.set('profileSummary', profileSummary)
  const queryString = params.toString()
  return apiRequest(`/api/jobs/ai/search${queryString ? `?${queryString}` : ''}`)
}

export async function generateCoverLetter(id) {
  return apiRequest(`/api/jobs/${id}/ai/cover-letter`, { method: 'POST' })
}

export async function generateInterviewPrep(id) {
  return apiRequest(`/api/jobs/${id}/ai/interview-prep`, { method: 'POST' })
}

export async function parseResumeText(resumeText) {
  return apiRequest('/api/profiles/seeker/ai/parse-resume', {
    method: 'POST',
    body: { resumeText },
  })
}

export async function applyToJob(id, coverLetter) {
  return apiRequest(`/api/jobs/${id}/apply`, {
    method: 'POST',
    body: { coverLetter },
  })
}

export async function saveJobListing(id) {
  return apiRequest(`/api/jobs/${id}/save`, { method: 'POST' })
}

export async function unsaveJobListing(id) {
  return apiRequest(`/api/jobs/${id}/save`, { method: 'DELETE' })
}

export async function fetchMyApplications() {
  return apiRequest('/api/jobs/applications/mine')
}

export async function fetchRecruiterJobs() {
  return apiRequest('/api/jobs/recruiter/mine')
}

export async function postJob(data) {
  return apiRequest('/api/jobs', { method: 'POST', body: data })
}

export async function fetchSeekerProfile() {
  return apiRequest('/api/profiles/seeker')
}

export async function saveSeekerProfile(data) {
  return apiRequest('/api/profiles/seeker', { method: 'PUT', body: data })
}

export async function fetchCompanies() {
  return apiRequest('/api/profiles/companies')
}

export async function fetchRecruiterProfile() {
  return apiRequest('/api/profiles/recruiter')
}

export async function saveRecruiterProfile(data) {
  return apiRequest('/api/profiles/recruiter', { method: 'PUT', body: data })
}

export async function fetchRecruiterApplications({ jobId, status } = {}) {
  const params = new URLSearchParams()
  if (jobId) params.set('jobId', String(jobId))
  if (status) params.set('status', status)
  const query = params.toString()
  return apiRequest(`/api/jobs/recruiter/applications${query ? `?${query}` : ''}`)
}

export async function fetchRecruiterApplication(appId) {
  return apiRequest(`/api/jobs/recruiter/applications/${appId}`)
}

export async function updateApplicationStatus(appId, status, note) {
  return apiRequest(`/api/jobs/recruiter/applications/${appId}/status`, {
    method: 'PATCH',
    body: { status, note },
  })
}
