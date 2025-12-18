import express from 'express'
import { requireAuth } from '../middlewares/authMiddleware.js'
import { getCollection } from '../mongodb.js'
import { ObjectId } from 'mongodb'

const router = express.Router()

// Placeholder - você pode expandir depois
router.get('/assets', requireAuth, async (req, res) => {
  try {
    const portfolioAssets = await getCollection('portfolio_assets')
    const userId = req.user.userId

    const assets = await portfolioAssets
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray()

    const formattedAssets = assets.map(asset => ({
      id: asset._id.toString(),
      userId: asset.userId.toString(),
      ativo_codigo: asset.assetCode,
      quantidade: asset.currentPosition.quantity,
      preco_medio: asset.currentPosition.averagePrice,
      data_compra: asset.currentPosition.firstPurchaseDate.toISOString().split('T')[0],
      created_at: asset.createdAt.toISOString(),
      updated_at: asset.updatedAt.toISOString(),
    }))

    res.status(200).json(formattedAssets)
  } catch (error) {
    console.error('Get assets error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
