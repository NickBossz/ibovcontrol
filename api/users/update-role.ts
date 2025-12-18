import type { VercelResponse } from '@vercel/node'
import { ObjectId } from 'mongodb'
import { getCollection } from '../../lib/mongodb.js'
import { requireAdmin, setCorsHeaders, type AuthRequest } from '../../lib/middleware.js'

async function handler(req: AuthRequest, res: VercelResponse) {
  setCorsHeaders(res)

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, newRole } = req.body

    if (!userId || !newRole) {
      return res.status(400).json({ error: 'userId and newRole are required' })
    }

    if (!['cliente', 'admin'].includes(newRole)) {
      return res.status(400).json({ error: 'Invalid role. Must be "cliente" or "admin"' })
    }

    const users = await getCollection('users')

    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          role: newRole,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.status(200).json({
      success: true,
      message: 'User role updated successfully',
    })
  } catch (error) {
    console.error('Update role error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default requireAdmin(handler)
