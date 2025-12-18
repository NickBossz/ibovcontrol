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
      user_id: asset.userId.toString(),
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
      user_id: userId.toString(),
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
      user_id: asset.userId.toString(),
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

// ===== OPERATIONS ROUTES =====

// GET /operations - List operations of an asset
router.get('/operations', requireAuth, async (req, res) => {
  try {
    const { assetId } = req.query

    if (!assetId || typeof assetId !== 'string') {
      return res.status(400).json({ error: 'Asset ID is required' })
    }

    const portfolioAssets = await getCollection('portfolio_assets')
    const userId = new ObjectId(req.user.userId)

    const asset = await portfolioAssets.findOne({
      _id: new ObjectId(assetId),
      userId,
    })

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    const operations = (asset.operations || []).map(op => ({
      id: op._id.toString(),
      tipo_operacao: op.type,
      quantidade: op.quantity,
      preco: op.price,
      data_operacao: op.operationDate.toISOString().split('T')[0],
      notes: op.notes || null,
      created_at: op.createdAt.toISOString(),
    }))

    res.status(200).json(operations)
  } catch (error) {
    console.error('Get operations error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /operations - Add operation to an asset
router.post('/operations', requireAuth, async (req, res) => {
  try {
    const { assetId, tipo_operacao, quantidade, preco, data_operacao, notes } = req.body

    if (!assetId || !tipo_operacao || quantidade === undefined || preco === undefined) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (!['entrada', 'saida'].includes(tipo_operacao)) {
      return res.status(400).json({ error: 'tipo_operacao must be "entrada" or "saida"' })
    }

    const portfolioAssets = await getCollection('portfolio_assets')
    const userId = new ObjectId(req.user.userId)

    const newOperation = {
      _id: new ObjectId(),
      type: tipo_operacao,
      quantity: parseFloat(quantidade),
      price: parseFloat(preco),
      operationDate: data_operacao ? new Date(data_operacao) : new Date(),
      notes: notes || null,
      createdAt: new Date(),
    }

    const result = await portfolioAssets.findOneAndUpdate(
      { _id: new ObjectId(assetId), userId },
      {
        $push: { operations: newOperation },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    )

    if (!result) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    // Recalcular posição atual baseado em todas as operações
    const asset = result
    let totalQuantity = 0
    let totalInvested = 0
    let firstDate = asset.currentPosition?.firstPurchaseDate

    asset.operations.forEach(op => {
      if (op.type === 'entrada') {
        totalQuantity += op.quantity
        totalInvested += op.quantity * op.price
        if (!firstDate || op.operationDate < firstDate) {
          firstDate = op.operationDate
        }
      } else {
        totalQuantity -= op.quantity
      }
    })

    const averagePrice = totalQuantity > 0 ? totalInvested / totalQuantity : 0

    // Atualizar currentPosition
    await portfolioAssets.updateOne(
      { _id: new ObjectId(assetId), userId },
      {
        $set: {
          'currentPosition.quantity': totalQuantity,
          'currentPosition.averagePrice': averagePrice,
          'currentPosition.totalInvested': totalInvested,
          'currentPosition.firstPurchaseDate': firstDate,
          updatedAt: new Date(),
        }
      }
    )

    res.status(200).json({
      id: newOperation._id.toString(),
      tipo_operacao: newOperation.type,
      quantidade: newOperation.quantity,
      preco: newOperation.price,
      data_operacao: newOperation.operationDate.toISOString().split('T')[0],
      notes: newOperation.notes,
      created_at: newOperation.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Add operation error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /operations - Remove operation from an asset
router.delete('/operations', requireAuth, async (req, res) => {
  try {
    const { assetId, operationId } = req.query

    if (!assetId || typeof assetId !== 'string' || !operationId || typeof operationId !== 'string') {
      return res.status(400).json({ error: 'Asset ID and Operation ID are required' })
    }

    const portfolioAssets = await getCollection('portfolio_assets')
    const userId = new ObjectId(req.user.userId)

    const result = await portfolioAssets.findOneAndUpdate(
      { _id: new ObjectId(assetId), userId },
      {
        $pull: { operations: { _id: new ObjectId(operationId) } },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    )

    if (!result) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    // Recalcular posição atual
    const asset = result
    let totalQuantity = 0
    let totalInvested = 0
    let firstDate = null

    asset.operations.forEach(op => {
      if (op.type === 'entrada') {
        totalQuantity += op.quantity
        totalInvested += op.quantity * op.price
        if (!firstDate || op.operationDate < firstDate) {
          firstDate = op.operationDate
        }
      } else {
        totalQuantity -= op.quantity
      }
    })

    const averagePrice = totalQuantity > 0 ? totalInvested / totalQuantity : 0

    await portfolioAssets.updateOne(
      { _id: new ObjectId(assetId), userId },
      {
        $set: {
          'currentPosition.quantity': totalQuantity,
          'currentPosition.averagePrice': averagePrice,
          'currentPosition.totalInvested': totalInvested,
          'currentPosition.firstPurchaseDate': firstDate || new Date(),
          updatedAt: new Date(),
        }
      }
    )

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Delete operation error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
