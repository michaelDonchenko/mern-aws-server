const express = require('express')
const {
  register,
  registerActivate,
  login,
  requireSignin,
  forgotPassword,
  resetPassword,
} = require('../controllers/authControllers')
const router = express.Router()

router.post('/register', register)
router.post('/register/activate', registerActivate)
router.post('/login', login)
router.put('/forgot-password', forgotPassword)
router.put('/reset-password', resetPassword)

module.exports = router
