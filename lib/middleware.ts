import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyToken } from './auth.js'
import type { JWTPayload } from './types.js'

export interface AuthRequest extends VercelRequest {
  user?: JWTPayload
}

export type Handler = (req: AuthRequest, res: VercelResponse) => Promise<void | VercelResponse>

export const requireAuth = (handler: Handler): Handler => {
  return async (req: AuthRequest, res: VercelResponse) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    const token =
      req.headers.authorization?.replace('Bearer ', '') ||
      req.cookies?.token

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    req.user = payload
    return handler(req, res)
  }
}

export const requireAdmin = (handler: Handler): Handler => {
  return requireAuth(async (req, res) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }
    return handler(req, res)
  })
}

export const setCorsHeaders = (res: VercelResponse) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080'
  res.setHeader('Access-Control-Allow-Origin', frontendUrl)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
}
