const express = require('express')
const dotenv = require('dotenv')
const morgan = require('morgan')
const app = express()
dotenv.config()
const { readdirSync } = require('fs')
const path = require('path')
const connectDB = require('./config/DB')
const cors = require('cors')

//init middleware
app.use(express.json({ limit: '5mb' }))
// app.use(express.urlencoded({ limit: '25mb' }))
app.use(morgan('dev'))
app.use(cors({ origin: process.env.CLIENT_URL }))

//DB connection
connectDB()

//init routes
readdirSync('./routes').map((r) => app.use('/api', require('./routes/' + r)))

//port listener
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`The app listening at http://localhost:${PORT}`)
})
