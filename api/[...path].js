import app from '../lib/app.js'

// Export Express app as Vercel serverless function
export default (req, res) => app(req, res)
