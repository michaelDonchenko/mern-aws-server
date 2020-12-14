const Category = require('../models/categoryModel')
const Link = require('../models/linkModel')
const slugify = require('slugify')
const formidable = require('formidable')
const { v4: uuidv4 } = require('uuid')
const AWS = require('aws-sdk')
const fs = require('fs')

// s3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
})

exports.create = async (req, res) => {
  const { name, image, content } = req.body

  if (!name || !content || !image) {
    return res.status(400).json({
      error: 'All fields required',
    })
  }

  const categoryExist = await Category.findOne({ name: name }).exec()
  if (categoryExist) {
    return res.status(400).json({
      error: 'Category name has to be unique.',
    })
  }

  if (image.size > 5000000) {
    return res.status(400).json({
      error: 'Image should be less than 5mb',
    })
  }

  // image data
  const base64Data = new Buffer.from(
    image.replace(/^data:image\/\w+;base64,/, ''),
    'base64'
  )
  const type = image.split(';')[0].split('/')[1]

  const slug = slugify(name)
  let category = new Category({ name, content, slug })

  const params = {
    Bucket: 'hcker-mern-aws',
    Key: `category/${uuidv4()}.${type}`,
    Body: base64Data,
    ACL: 'public-read',
    ContentEncoding: 'base64',
    ContentType: `image/${type}`,
  }

  s3.upload(params, (err, data) => {
    if (err) {
      console.log(err)
      res.status(400).json({ error: 'Upload to s3 failed' })
    }
    console.log('AWS UPLOAD RES DATA', data)
    category.image.url = data.Location
    category.image.key = data.Key
    // posted by
    category.postedBy = req.user._id

    // save to db
    category.save((error, success) => {
      if (error) {
        console.log(error)
        res.status(400).json({ error: error.message })
      }
      return res.json({ message: 'Category created succefully.' })
    })
  })
}

exports.list = async (req, res) => {
  const categories = await Category.find().exec()

  if (!categories) {
    return res.status(400).json({
      error: 'Could not find categories',
    })
  } else {
    res.status(200).json({ categories })
  }
}

exports.read = (req, res) => {
  const { slug } = req.params
  let limit = req.body.limit ? parseInt(req.body.limit) : 10
  let skip = req.body.skip ? parseInt(req.body.skip) : 0

  Category.findOne({ slug })
    .populate('postedBy', '_id name ')
    .exec((err, category) => {
      if (err) {
        return res.status(400).json({
          error: 'Could not load category',
        })
      }
      // res.json(category);
      Link.find({ categories: category })
        .populate('postedBy', '_id name ')
        .populate('categories', 'name')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .exec((err, links) => {
          if (err) {
            return res.status(400).json({
              error: 'Could not load links of a category',
            })
          }
          res.json({ category, links })
        })
    })
}

exports.update = (req, res) => {
  const { slug } = req.params
  const { name, image, content } = req.body

  Category.findOneAndUpdate({ slug }, { name, content }, { new: true }).exec(
    (err, updated) => {
      if (err) {
        return res.status(400).json({
          error: 'Could not find category to update',
        })
      }
      console.log('UPDATED', updated)
      if (image) {
        // image data
        const base64Data = new Buffer.from(
          image.replace(/^data:image\/\w+;base64,/, ''),
          'base64'
        )
        const type = image.split(';')[0].split('/')[1]

        // remove the existing image from s3 before uploading new/updated one
        const deleteParams = {
          Bucket: 'hcker-mern-aws',
          Key: updated.image.key,
        }

        s3.deleteObject(deleteParams, function (err, data) {
          if (err) console.log('S3 DELETE ERROR DUING UPDATE', err)
          else console.log('S3 DELETED DURING UPDATE', data) // deleted
        })

        // handle upload image
        const params = {
          Bucket: 'hcker-mern-aws',
          Key: `category/${uuidv4()}.${type}`,
          Body: base64Data,
          ACL: 'public-read',
          ContentEncoding: 'base64',
          ContentType: `image/${type}`,
        }

        s3.upload(params, (err, data) => {
          if (err) {
            console.log(err)
            res.status(400).json({ error: 'Upload to s3 failed' })
          }
          console.log('AWS UPLOAD RES DATA', data)
          updated.image.url = data.Location
          updated.image.key = data.Key

          // save to db
          updated.save((err, success) => {
            if (err) {
              console.log(err)
              res.status(400).json({ error: err.message })
            }
            res.json({ message: 'Category updated succefully' })
          })
        })
      } else {
        res.json({ message: 'Category updated succefully' })
      }
    }
  )
}

exports.remove = (req, res) => {
  const { slug } = req.params

  Category.findOneAndRemove({ slug }).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: 'Could not find category to update',
      })
    }

    // remove the existing image from s3 before uploading new/updated one
    const deleteParams = {
      Bucket: 'hcker-mern-aws',
      Key: data.image.key,
    }

    s3.deleteObject(deleteParams, function (err, res) {
      if (err) console.log('S3 DELETE ERROR', err)
      else console.log('S3 DELETED', res) // deleted
    })

    res.json({ message: 'Category Deleted succefully' })
  })
}
