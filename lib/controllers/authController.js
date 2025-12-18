import { ObjectId } from 'mongodb'
import { getCollection } from '../mongodb.js'
import { comparePassword, hashPassword, signToken } from '../auth.js'

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const users = await getCollection('users')
    const user = await users.findOne({ email: email.toLowerCase() })

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

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

export const signup = async (req, res) => {
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
    const newUser = {
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

export const logout = async (req, res) => {
  // For JWT-based auth with localStorage, logout is handled client-side
  // This endpoint exists for consistency and future enhancements (e.g., token blacklisting)
  return res.status(200).json({ success: true, message: 'Logged out successfully' })
}

export const resetPassword = async (req, res) => {
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
