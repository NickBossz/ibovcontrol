import express from 'express'
import * as authController from '../controllers/authController.js'

const router = express.Router()

router.post('/login', authController.login)
router.post('/signup', authController.signup)
router.post('/logout', authController.logout)
router.post('/reset-password', authController.resetPassword)

export default router
