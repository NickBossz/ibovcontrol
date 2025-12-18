import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCorsHeaders } from '../../lib/middleware.js'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  setCorsHeaders(res, req)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // For JWT-based auth with localStorage, logout is handled client-side
  // This endpoint exists for consistency and future enhancements (e.g., token blacklisting)
  return res.status(200).json({ success: true, message: 'Logged out successfully' })
}
