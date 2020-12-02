exports.registerEmailParams = (name, email, token) => {
  return {
    Source: process.env.EMAIL_FROM,
    Destination: {
      ToAddresses: [email],
    },
    ReplyToAddresses: [process.env.EMAIL_TO],
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: `
              <html>
                  <h2>Hello ${name}, Verify your email address</h2>
                  <p>Please use the following link to complete your registration:</p>
                  <p>${process.env.CLIENT_URL}/auth/activate/${token}</p>
              </html>
          `,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: 'Complete your registration',
      },
    },
  }
}

exports.forgotPasswordEmailParams = (email, token) => {
  return {
    Source: process.env.EMAIL_FROM,
    Destination: {
      ToAddresses: [email],
    },
    ReplyToAddresses: [process.env.EMAIL_FROM],
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: `
                      <html>
                          <h2>Reset Password Link</h2>
                          <p>Please use the following link to reset your password:</p>
                          <p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
                      </html>
                  `,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: 'Reset your password link',
      },
    },
  }
}
