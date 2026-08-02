import { apiRequest } from './api'
import { clearAuth, getStoredUser, getToken, saveAuth } from './storage'

export { clearAuth, getStoredUser, getToken, saveAuth }

export async function signupRequest({ name, email, password }) {
  return apiRequest('/api/auth/signup', {
    method: 'POST',
    body: { name, email, password },
  })
}

export async function loginRequest({ email, password }) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}

export async function socialLoginRequest(provider) {
  return apiRequest('/api/auth/social', {
    method: 'POST',
    body: {
      provider,
      providerUserId: `${provider}-demo-user`,
      name: `${provider.charAt(0).toUpperCase()}${provider.slice(1)} User`,
      email: `user@${provider}.workmate.local`,
    },
  })
}

export async function fetchMe() {
  return apiRequest('/api/auth/me')
}

export async function logoutRequest() {
  return apiRequest('/api/auth/logout', { method: 'POST' })
}

export async function fetchTools() {
  return apiRequest('/api/tools')
}

export async function runTool(slug, input, options = {}) {
  return apiRequest(`/api/tools/${slug}/run`, {
    method: 'POST',
    body: { input, options },
  })
}

export async function fetchTestimonials() {
  return apiRequest('/api/testimonials')
}

export async function fetchDashboardOverview() {
  return apiRequest('/api/dashboard/overview')
}

export async function fetchDashboardHistory({ category, slug, q, limit, offset } = {}) {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (slug) params.set('slug', slug)
  if (q) params.set('q', q)
  if (limit) params.set('limit', String(limit))
  if (offset) params.set('offset', String(offset))
  const query = params.toString()
  return apiRequest(`/api/dashboard/history${query ? `?${query}` : ''}`)
}

export async function fetchJob(id) {
  return apiRequest(`/api/dashboard/history/${id}`)
}

export async function saveJob(id) {
  return apiRequest(`/api/dashboard/history/${id}/save`, { method: 'POST' })
}

export async function unsaveJob(id) {
  return apiRequest(`/api/dashboard/history/${id}/save`, { method: 'DELETE' })
}

export async function deleteJob(id) {
  return apiRequest(`/api/dashboard/history/${id}`, { method: 'DELETE' })
}
