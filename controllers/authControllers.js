const AWS = require('aws-sdk')
const User = require('../models/userModel')
const jwt = require('jsonwebtoken')
const expressJwt = require('express-jwt')
const _ = require('lodash')
const {
  registerEmailParams,
  forgotPasswordEmailParams,
} = require('../helpers/email')

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
})

const ses = new AWS.SES({ apiVersion: '2010-12-01' })

//register a new user && send activation email
exports.register = (req, res) => {
  const { name, email, password } = req.body

  if (password.length < 8) {
    return res.status(400).json({
      error: 'Password length has to be minimum 8 characters.',
    })
  }

  User.findOne({ email: email }).exec((err, user) => {
    if (err) {
      return res.status(400).json({
        err,
      })
    }
    if (user) {
      return res.status(400).json({
        error: 'An account with this email already exists.',
      })
    }
    // generate token with user name email and password
    const token = jwt.sign(
      { name, email, password },
      process.env.JWT_ACCOUNT_ACTIVATION,
      {
        expiresIn: '7d',
      }
    )

    //send email
    const params = registerEmailParams(name, email, token)

    const sendEmailOnRegister = ses.sendEmail(params).promise()

    sendEmailOnRegister
      .then((data) => {
        console.log('email submitted to SES', data)
        res.json({
          message: `Email has been sent to ${email}, please follow the instructions to complete your registration.`,
        })
      })
      .catch((error) => {
        console.log('ses email on register', error)
        res.json({
          message:
            'We could not sent verification to your email address, Please try again',
        })
      })
  })
}

//activate user and finish registration
exports.registerActivate = (req, res) => {
  const { token } = req.body
  jwt.verify(
    token,
    process.env.JWT_ACCOUNT_ACTIVATION,
    function (err, decoded) {
      if (err) {
        return res.status(401).json({
          error: 'Expired or Invalid link. Try again',
        })
      }

      const { name, email, password } = jwt.decode(token)

      User.findOne({ email }).exec((err, user) => {
        if (user) {
          return res.status(401).json({
            error: 'Email is taken',
          })
        }

        // register new user
        const newUser = new User({ name, email, password })
        newUser.save((err, result) => {
          if (err) {
            return res.status(401).json({
              error: 'Error saving user in database. Try later',
            })
          }
          return res.json({
            message: 'Registration success. Please login.',
          })
        })
      })
    }
  )
}

//login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    //validation
    if (!email || !password)
      return res
        .status(400)
        .json({ error: 'Not all fields have been entered.' })

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: 'Password has to be at least 8 characters' })
    }

    //check if the email entered by the user exist
    let user = await User.findOne({ email: email })
    if (!user) {
      return res
        .status(400)
        .json({ error: 'No account with this email has been registered.' })
    }

    if (!user.authenticate(password)) {
      return res.status(400).json({ error: 'Invalid credentials.' })
    }

    //if everything passed generate a token and send to the client
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    })

    res.status(200).json({
      token,
      user: {
        name: user.name,
        email: user.email,
        _id: user._id,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(500).json({
      error: error.message,
    })
  }
}

//auth check for the token that is sent from client
//with this we have access to the user id by req.user._id
exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256'],
}) // req.user

// email with forgot password link
exports.forgotPassword = (req, res) => {
  const { email } = req.body
  // check if user exists with that email
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: 'User with that email does not exist',
      })
    }
    // generate token and email to user
    const token = jwt.sign(
      { name: user.name },
      process.env.JWT_RESET_PASSWORD,
      { expiresIn: '10m' }
    )
    // send email
    const params = forgotPasswordEmailParams(email, token)

    // populate the db > user > resetPasswordLink
    return user.updateOne({ resetPasswordLink: token }, (err, success) => {
      if (err) {
        return res.status(400).json({
          error: 'Password reset failed. Try later.',
        })
      }
      const sendEmail = ses.sendEmail(params).promise()
      sendEmail
        .then((data) => {
          console.log('ses reset pw success', data)
          return res.json({
            message: `Email has been sent to ${email}. Click on the link to reset your password`,
          })
        })
        .catch((error) => {
          console.log('ses reset pw failed', error)
          return res.json({
            error: `We could not vefiry your email. Try later.`,
          })
        })
    })
  })
}

//reset password link activation
exports.resetPassword = (req, res) => {
  const { resetPasswordLink, newPassword } = req.body

  if (newPassword.length < 8) {
    return res.status(400).json({
      error: 'Password length has to be minimum 8 characters.',
    })
  }

  if (resetPasswordLink) {
    User.findOne({ resetPasswordLink }).exec((err, user) => {
      if (err || !user) {
        return res.status(400).json({
          error: 'Invalid token. Try again',
        })
      }

      // check for expiry
      jwt.verify(
        resetPasswordLink,
        process.env.JWT_RESET_PASSWORD,
        (err, success) => {
          if (err) {
            return res.status(400).json({
              error: 'Expired or Invalid Link. Try again.',
            })
          }

          const updatedFields = {
            password: newPassword,
            resetPasswordLink: '',
          }

          user = _.extend(user, updatedFields)

          user.save((err, result) => {
            if (err) {
              return res.status(400).json({
                error: 'Password reset failed. Try again',
              })
            }

            res.json({
              message: `Password reset success, you can login with your new password.`,
            })
          })
        }
      )
    })
  }
}
