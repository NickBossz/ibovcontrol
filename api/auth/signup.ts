import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ObjectId } from 'mongodb'
import { getCollection } from '../../lib/mongodb.js'
import { hashPassword, signToken } from '../../lib/auth.js'
import { setCorsHeaders } from '../../lib/middleware.js'
import type { User } from '../../lib/types.js'

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

  try {
    const { email, password, name } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const users = await getCollection('users')

    // Check if user already exists
    const existingUser = await users.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const newUser: Omit<User, '_id'> = {
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'cliente', // Default role
      name: name || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignInAt: new Date(),
    }

    const result = await users.insertOne(newUser)
    const userId = result.insertedId.toString()

    // Generate JWT token
    const token = signToken({
      userId,
      email: email.toLowerCase(),
      role: 'cliente',
    })

    return res.status(200).json({
      user: {
        id: userId,
        email: email.toLowerCase(),
        role: 'cliente',
        name: name || null,
        createdAt: newUser.createdAt,
      },
      token,
    })
  } catch (error) {
    console.error('Signup error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
