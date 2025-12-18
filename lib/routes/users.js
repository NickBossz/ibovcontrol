import express from 'express'
import * as usersController from '../controllers/usersController.js'
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/me', requireAuth, usersController.getMe)
router.get('/role', requireAuth, usersController.getRole)
router.get('/list', requireAdmin, usersController.listUsers)
router.put('/update-role', requireAdmin, usersController.updateRole)

export default router
