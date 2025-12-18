import { ObjectId } from 'mongodb'
import { getCollection } from '../mongodb.js'

export const getMe = async (req, res) => {
  try {
    const users = await getCollection('users')
    const user = await users.findOne({ _id: new ObjectId(req.user.userId) })

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

export const getRole = async (req, res) => {
  try {
    return res.status(200).json({ role: req.user.role })
  } catch (error) {
    console.error('Get role error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const listUsers = async (req, res) => {
  try {
    const users = await getCollection('users')
    const userList = await users
      .find({})
      .project({ password: 0 })
      .sort({ createdAt: -1 })
      .toArray()

    const formattedUsers = userList.map(user => ({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name || null,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
    }))

    return res.status(200).json({ users: formattedUsers })
  } catch (error) {
    console.error('List users error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateRole = async (req, res) => {
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
      { $set: { role: newRole, updatedAt: new Date() } }
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
