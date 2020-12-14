const express = require('express')
const router = express.Router()

// controllers
const { requireSignin } = require('../controllers/authControllers')
const {
  create,
  list,
  read,
  update,
  remove,
} = require('../controllers/categoryControllers')
const { adminMiddleware } = require('../middleware/authMiddleware')

// routes
router.post('/category', requireSignin, adminMiddleware, create)
router.get('/categories', list)
router.post('/category/:slug', read)
router.put('/category/:slug', requireSignin, adminMiddleware, update)
router.delete('/category/:slug', requireSignin, adminMiddleware, remove)

module.exports = router
