import type { VercelResponse } from '@vercel/node'
import { ObjectId } from 'mongodb'
import { getCollection } from '../../lib/mongodb.js'
import { requireAuth, setCorsHeaders, type AuthRequest } from '../../lib/middleware.js'
import type { PortfolioAsset } from '../../lib/types.js'

async function handler(req: AuthRequest, res: VercelResponse) {
  setCorsHeaders(res, req)

  if (req.method === 'GET') {
    return handleGet(req, res)
  } else if (req.method === 'POST') {
    return handlePost(req, res)
  } else if (req.method === 'PUT') {
    return handlePut(req, res)
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleGet(req: AuthRequest, res: VercelResponse) {
  try {
    const portfolioAssets = await getCollection('portfolio_assets')
    const userId = req.user!.userId

    const assets = await portfolioAssets
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray() as PortfolioAsset[]

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

    return res.status(200).json(formattedAssets)
  } catch (error) {
    console.error('Get assets error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handlePost(req: AuthRequest, res: VercelResponse) {
  try {
    const { ativo_codigo, quantidade, preco_medio, data_compra } = req.body

    if (!ativo_codigo || quantidade === undefined || preco_medio === undefined) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const portfolioAssets = await getCollection('portfolio_assets')
    const userId = new ObjectId(req.user!.userId)

    const newAsset: Omit<PortfolioAsset, '_id'> = {
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

    return res.status(200).json({
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
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handlePut(req: AuthRequest, res: VercelResponse) {
  try {
    const { id, quantidade, preco_medio } = req.body

    if (!id) {
      return res.status(400).json({ error: 'Asset ID is required' })
    }

    const portfolioAssets = await getCollection('portfolio_assets')
    const userId = new ObjectId(req.user!.userId)

    const updateData: any = { updatedAt: new Date() }

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

    const asset = result as PortfolioAsset

    return res.status(200).json({
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
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleDelete(req: AuthRequest, res: VercelResponse) {
  try {
    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Asset ID is required' })
    }

    const portfolioAssets = await getCollection('portfolio_assets')
    const userId = new ObjectId(req.user!.userId)

    const result = await portfolioAssets.deleteOne({
      _id: new ObjectId(id),
      userId,
    })

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Delete asset error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default requireAuth(handler)
