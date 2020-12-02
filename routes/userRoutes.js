const express = require('express')
const router = express.Router()

// import middlewares
const { requireSignin } = require('../controllers/authControllers')

// import controllers
const { read } = require('../controllers/userControllers')
const {
  authMiddleware,
  adminMiddleware,
} = require('../middleware/authMiddleware')

// routes
router.get('/user', requireSignin, authMiddleware, read)
router.get('/admin', requireSignin, adminMiddleware, read)

module.exports = router
