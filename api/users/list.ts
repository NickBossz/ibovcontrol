import type { VercelResponse } from '@vercel/node'
import { getCollection } from '../lib/mongodb'
import { requireAdmin, setCorsHeaders, type AuthRequest } from '../lib/middleware'
import type { User } from '../lib/types'

async function handler(req: AuthRequest, res: VercelResponse) {
  setCorsHeaders(res)

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const users = await getCollection('users')
    const userList = await users
      .find({})
      .project({ password: 0 }) // Exclude password
      .sort({ createdAt: -1 })
      .toArray() as User[]

    const formattedUsers = userList.map(user => ({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name || null,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
    }))

    return res.status(200).json({
      users: formattedUsers,
    })
  } catch (error) {
    console.error('List users error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default requireAdmin(handler)
