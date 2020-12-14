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
  clickCount,
  popular,
  popularInCategory,
} = require('../controllers/linkControllers')
const { authMiddleware } = require('../middleware/authMiddleware')

// routes
router.post('/link', requireSignin, authMiddleware, create)
router.get('/links', list)
router.get('/link/popular', popular)
router.get('/link/popular/:slug', popularInCategory)
router.get('/link/:id', read)
router.put('/click-count', clickCount)
router.put('/link/:id', requireSignin, authMiddleware, update)
router.delete('/link/:id', requireSignin, authMiddleware, remove)

module.exports = router
