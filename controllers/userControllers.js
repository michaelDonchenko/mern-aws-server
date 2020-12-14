const User = require('../models/userModel')
const Link = require('../models/linkModel')

exports.read = (req, res) => {
  User.findOne({ _id: req.user._id }).exec((err, user) => {
    if (err) {
      return res.status(400).json({
        error: 'User not found',
      })
    }
    Link.find({ postedBy: user })
      .populate('categories', 'name slug')
      .populate('postedBy', 'name')
      .sort({ createdAt: -1 })
      .exec((err, links) => {
        if (err) {
          return res.status(400).json({
            error: 'Could not find links',
          })
        }
        user.hashed_password = undefined
        user.salt = undefined
        res.json({ user, links })
      })
  })
}

exports.update = (req, res) => {
  const { name, newPassword, confirmPassword } = req.body

  if (newPassword && newPassword.length < 8) {
    return res.status(400).json({
      error: 'Password has to be at least 8 characters long.',
    })
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      error: 'Passwords do not match validation failed.',
    })
  }

  User.findOneAndUpdate({ _id: req.user._id }, { name }, { new: true }).exec(
    (err, user) => {
      if (err) {
        return res.status(400).json({
          error: 'Could not update user details.',
        })
      }
      res.json({ message: 'Updated succefully' })
    }
  )
}
