//auth middleware
exports.authMiddleware = (req, res, next) => {
  const authUserId = req.user._id
  User.findOne({ _id: authUserId }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: 'User not found',
      })
    }
    req.profile = user
    next()
  })
}

//admin middleware
exports.adminMiddleware = (req, res, next) => {
  const adminUserId = req.user._id
  User.findOne({ _id: adminUserId }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: 'User not found',
      })
    }

    if (user.role !== 'admin') {
      return res.status(400).json({
        error: 'Admin resource. Access denied',
      })
    }

    req.profile = user
    next()
  })
}
