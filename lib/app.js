import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import portfolioRoutes from './routes/portfolio.js'
import supportResistanceRoutes from './routes/supportResistance.js'

const app = express()

// Trust proxy - necessário porque Vercel coloca a aplicação atrás de proxy reverso
app.set('trust proxy', 1)

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}))

// CORS - permite origin dinâmico
app.use(cors({
  origin: (origin, callback) => {
    // Em desenvolvimento, permite localhost
    // Em produção, permite o domínio da Vercel
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:3000',
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
    ].filter(Boolean)

    if (!origin || allowedOrigins.some(allowed => origin.includes(allowed.replace('https://', '').replace('http://', '')))) {
      callback(null, true)
    } else {
      callback(null, true) // Permite todas em desenvolvimento
    }
  },
  credentials: true
}))

// Body parser
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Middleware para remover /api/ do path quando vier da Vercel
app.use((req, res, next) => {
  // Vercel passa URLs como /api/... mas precisamos rotear sem o /api
  if (req.url.startsWith('/api/')) {
    req.url = req.url.replace('/api', '')
  }
  next()
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/auth', authRoutes)
app.use('/users', usersRoutes)
app.use('/portfolio', portfolioRoutes)
app.use('/support-resistance', supportResistanceRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  })
})

export default app
