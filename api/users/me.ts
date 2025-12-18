import type { VercelResponse } from '@vercel/node'
import { ObjectId } from 'mongodb'
import { getCollection } from '../../lib/mongodb.js'
import { requireAuth, setCorsHeaders, type AuthRequest } from '../../lib/middleware.js'
import type { User } from '../../lib/types.js'

async function handler(req: AuthRequest, res: VercelResponse) {
  setCorsHeaders(res, req)

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const users = await getCollection('users')
    const user = await users.findOne({ _id: new ObjectId(req.user!.userId) }) as User | null

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.status(200).json({
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name || null,
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default requireAuth(handler)
