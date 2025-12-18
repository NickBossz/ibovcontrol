import express from 'express'
import { requireAuth } from '../middlewares/authMiddleware.js'
import { getCollection } from '../mongodb.js'
import { ObjectId } from 'mongodb'

const router = express.Router()

// GET /assets
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

// POST /assets
router.post('/assets', requireAuth, async (req, res) => {
  try {
    const { ativo_codigo, quantidade, preco_medio, data_compra } = req.body

    if (!ativo_codigo || quantidade === undefined || preco_medio === undefined) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const portfolioAssets = await getCollection('portfolio_assets')
    const userId = new ObjectId(req.user.userId)

    const newAsset = {
      userId,
      assetCode: ativo_codigo.toUpperCase(),
      currentPosition: {
        quantity: parseFloat(quantidade),
        averagePrice: parseFloat(preco_medio),
        totalInvested: parseFloat(quantidade) * parseFloat(preco_medio),
        firstPurchaseDate: data_compra ? new Date(data_compra) : new Date(),
      },
      operations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await portfolioAssets.insertOne(newAsset)

    res.status(200).json({
      id: result.insertedId.toString(),
      userId: userId.toString(),
      ativo_codigo: newAsset.assetCode,
      quantidade: newAsset.currentPosition.quantity,
      preco_medio: newAsset.currentPosition.averagePrice,
      data_compra: newAsset.currentPosition.firstPurchaseDate.toISOString().split('T')[0],
      created_at: newAsset.createdAt.toISOString(),
      updated_at: newAsset.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Create asset error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /assets
router.put('/assets', requireAuth, async (req, res) => {
  try {
    const { id, quantidade, preco_medio } = req.body

    if (!id) {
      return res.status(400).json({ error: 'Asset ID is required' })
    }

    const portfolioAssets = await getCollection('portfolio_assets')
    const userId = new ObjectId(req.user.userId)

    const updateData = { updatedAt: new Date() }

    if (quantidade !== undefined) {
      updateData['currentPosition.quantity'] = parseFloat(quantidade)
    }
    if (preco_medio !== undefined) {
      updateData['currentPosition.averagePrice'] = parseFloat(preco_medio)
    }
    if (quantidade !== undefined && preco_medio !== undefined) {
      updateData['currentPosition.totalInvested'] = parseFloat(quantidade) * parseFloat(preco_medio)
    }

    const result = await portfolioAssets.findOneAndUpdate(
      { _id: new ObjectId(id), userId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (!result) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    const asset = result

    res.status(200).json({
      id: asset._id.toString(),
      userId: asset.userId.toString(),
      ativo_codigo: asset.assetCode,
      quantidade: asset.currentPosition.quantity,
      preco_medio: asset.currentPosition.averagePrice,
      data_compra: asset.currentPosition.firstPurchaseDate.toISOString().split('T')[0],
      created_at: asset.createdAt.toISOString(),
      updated_at: asset.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Update asset error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /assets
router.delete('/assets', requireAuth, async (req, res) => {
  try {
    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Asset ID is required' })
    }

    const portfolioAssets = await getCollection('portfolio_assets')
    const userId = new ObjectId(req.user.userId)

    const result = await portfolioAssets.deleteOne({
      _id: new ObjectId(id),
      userId,
    })

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Delete asset error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
