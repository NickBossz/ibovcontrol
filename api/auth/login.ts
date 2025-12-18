import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getCollection } from '../../lib/mongodb.js'
import { comparePassword, signToken } from '../../lib/auth.js'
import { setCorsHeaders } from '../../lib/middleware.js'
import type { User } from '../../lib/types.js'

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
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const users = await getCollection('users')

    // Find user
    const user = await users.findOne({ email: email.toLowerCase() }) as User | null

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Update last sign in
    await users.updateOne(
      { _id: user._id },
      { $set: { lastSignInAt: new Date() } }
    )

    // Generate JWT token
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    })

    return res.status(200).json({
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name || null,
        createdAt: user.createdAt,
        lastSignInAt: new Date(),
      },
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
