import { ObjectId } from 'mongodb'

export interface User {
  _id: ObjectId
  email: string
  password: string
  role: 'cliente' | 'admin'
  name?: string
  createdAt: Date
  updatedAt: Date
  lastSignInAt?: Date
}

export interface JWTPayload {
  userId: string
  email: string
  role: 'cliente' | 'admin'
}

export interface PortfolioAsset {
  _id: ObjectId
  userId: ObjectId
  assetCode: string
  currentPosition: {
    quantity: number
    averagePrice: number
    totalInvested: number
    firstPurchaseDate: Date
  }
  operations: Operation[]
  createdAt: Date
  updatedAt: Date
}

export interface Operation {
  _id: ObjectId
  type: 'entrada' | 'saida'
  quantity: number
  price: number
  operationDate: Date
  notes?: string
  createdAt: Date
}

export interface SupportResistanceLevel {
  _id: ObjectId
  assetCode: string
  assetName: string
  support1?: number
  support2?: number
  resistance1?: number
  resistance2?: number
  levels?: Array<{
    type: 'suporte' | 'resistencia'
    value: number
    reason?: string
  }>
  adminId: ObjectId
  lastModified: Date
  createdAt: Date
  updatedAt: Date
}

export type UserRole = 'cliente' | 'admin'
