import express from 'express'
import { requireAuth } from '../middlewares/authMiddleware.js'
import { getCollection } from '../mongodb.js'

const router = express.Router()

// Placeholder - você pode expandir depois
router.get('/list', requireAuth, async (req, res) => {
  try {
    const supportResistance = await getCollection('support_resistance_levels')
    const { search, assetCode } = req.query

    let query = {}

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
      .toArray()

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

    res.status(200).json(formatted)
  } catch (error) {
    console.error('Get support/resistance error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
