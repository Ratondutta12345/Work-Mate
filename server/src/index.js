import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { pingDb } from './db.js'
import authRoutes from './routes/auth.js'
import toolsRoutes from './routes/tools.js'
import testimonialsRoutes from './routes/testimonials.js'
import jobsRoutes from './routes/jobs.js'
import profilesRoutes from './routes/profiles.js'
import dashboardRoutes from './routes/dashboard.js'

const app = express()

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', async (_req, res) => {
  try {
    await pingDb()
    res.json({ ok: true, database: 'connected' })
  } catch (error) {
    res.status(500).json({ ok: false, database: 'disconnected', error: error.message })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/tools', toolsRoutes)
app.use('/api/testimonials', testimonialsRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/jobs', jobsRoutes)
app.use('/api/profiles', profilesRoutes)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: 'Unexpected server error.' })
})

app.listen(config.port, () => {
  console.log(`Work Mate API running on http://localhost:${config.port}`)
})
