import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getCollection } from '../../lib/mongodb.js'
import { setCorsHeaders } from '../../lib/middleware.js'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const users = await getCollection('users')

    // Check if user exists
    const user = await users.findOne({ email: email.toLowerCase() })

    // For security, always return success even if user doesn't exist
    // TODO: Implement actual password reset logic with email sending
    return res.status(200).json({
      message: 'If an account exists with this email, you will receive password reset instructions.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
