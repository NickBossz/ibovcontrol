import type { VercelResponse } from '@vercel/node'
import { ObjectId } from 'mongodb'
import { getCollection } from '../../lib/mongodb.js'
import { requireAuth, requireAdmin, setCorsHeaders, type AuthRequest } from '../../lib/middleware.js'
import type { SupportResistanceLevel } from '../../lib/types.js'

async function handler(req: AuthRequest, res: VercelResponse) {
  setCorsHeaders(res)

  if (req.method === 'GET') {
    return handleGet(req, res)
  } else if (req.method === 'POST') {
    return handleCreate(req, res)
  } else if (req.method === 'PUT') {
    return handleUpdate(req, res)
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleGet(req: AuthRequest, res: VercelResponse) {
  try {
    const supportResistance = await getCollection('support_resistance_levels')
    const { search, assetCode } = req.query

    let query: any = {}

    if (assetCode && typeof assetCode === 'string') {
      query.assetCode = assetCode.toUpperCase()
    } else if (search && typeof search === 'string') {
      query.$or = [
        { assetCode: { $regex: search, $options: 'i' } },
        { assetName: { $regex: search, $options: 'i' } },
      ]
    }

    const levels = await supportResistance
      .find(query)
      .sort({ assetCode: 1 })
      .toArray() as SupportResistanceLevel[]

    const formatted = levels.map(level => ({
      id: level._id.toString(),
      ativo_codigo: level.assetCode,
      ativo_nome: level.assetName,
      suporte1: level.support1 || null,
      suporte2: level.support2 || null,
      resistencia1: level.resistance1 || null,
      resistencia2: level.resistance2 || null,
      niveis: level.levels || [],
      admin_id: level.adminId.toString(),
      ultima_modificacao: level.lastModified.toISOString(),
      created_at: level.createdAt.toISOString(),
      updated_at: level.updatedAt.toISOString(),
    }))

    return res.status(200).json(formatted)
  } catch (error) {
    console.error('Get support/resistance error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleCreate(req: AuthRequest, res: VercelResponse) {
  // Admin only
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }

  try {
    const { ativo_codigo, ativo_nome, niveis, suporte1, suporte2, resistencia1, resistencia2 } = req.body

    if (!ativo_codigo || !ativo_nome) {
      return res.status(400).json({ error: 'Asset code and name are required' })
    }

    const supportResistance = await getCollection('support_resistance_levels')

    const newLevel: Omit<SupportResistanceLevel, '_id'> = {
      assetCode: ativo_codigo.toUpperCase(),
      assetName: ativo_nome,
      support1: suporte1 || null,
      support2: suporte2 || null,
      resistance1: resistencia1 || null,
      resistance2: resistencia2 || null,
      levels: niveis || [],
      adminId: new ObjectId(req.user!.userId),
      lastModified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await supportResistance.insertOne(newLevel)

    return res.status(200).json({
      id: result.insertedId.toString(),
      ativo_codigo: newLevel.assetCode,
      ativo_nome: newLevel.assetName,
      niveis: newLevel.levels,
      admin_id: newLevel.adminId.toString(),
      created_at: newLevel.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Create support/resistance error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleUpdate(req: AuthRequest, res: VercelResponse) {
  // Admin only
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }

  try {
    const { id, niveis, suporte1, suporte2, resistencia1, resistencia2 } = req.body

    if (!id) {
      return res.status(400).json({ error: 'ID is required' })
    }

    const supportResistance = await getCollection('support_resistance_levels')

    const updateData: any = {
      adminId: new ObjectId(req.user!.userId),
      lastModified: new Date(),
      updatedAt: new Date(),
    }

    if (niveis !== undefined) updateData.levels = niveis
    if (suporte1 !== undefined) updateData.support1 = suporte1
    if (suporte2 !== undefined) updateData.support2 = suporte2
    if (resistencia1 !== undefined) updateData.resistance1 = resistencia1
    if (resistencia2 !== undefined) updateData.resistance2 = resistencia2

    const result = await supportResistance.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (!result) {
      return res.status(404).json({ error: 'Support/Resistance not found' })
    }

    const level = result as SupportResistanceLevel

    return res.status(200).json({
      id: level._id.toString(),
      ativo_codigo: level.assetCode,
      ativo_nome: level.assetName,
      niveis: level.levels,
      admin_id: level.adminId.toString(),
      updated_at: level.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Update support/resistance error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleDelete(req: AuthRequest, res: VercelResponse) {
  // Admin only
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }

  try {
    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'ID is required' })
    }

    const supportResistance = await getCollection('support_resistance_levels')

    const result = await supportResistance.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Support/Resistance not found' })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Delete support/resistance error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default requireAuth(handler)
