import type { VercelResponse } from '@vercel/node'
import { requireAuth, setCorsHeaders, type AuthRequest } from '../../lib/middleware.js'

async function handler(req: AuthRequest, res: VercelResponse) {
  setCorsHeaders(res, req)

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    return res.status(200).json({
      role: req.user!.role,
    })
  } catch (error) {
    console.error('Get role error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default requireAuth(handler)
