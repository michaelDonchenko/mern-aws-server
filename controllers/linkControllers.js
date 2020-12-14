const Link = require('../models/linkModel')
const slugify = require('slugify')
const Category = require('../models/categoryModel')

exports.create = (req, res) => {
  const { title, url, categories, type, medium } = req.body
  if (!title || !url || categories.length === 0 || !type || !medium) {
    return res.status(400).json({
      error: 'All fields are required.',
    })
  }

  const slug = url
  let link = new Link({ title, url, categories, type, medium, slug })
  // posted by user
  link.postedBy = req.user._id

  // save link
  link.save((err, data) => {
    if (err) {
      return res.status(400).json({
        error: err.message,
      })
    }
    res.json(data)
  })
}

exports.list = async (req, res) => {
  const pageSize = req.query.pageSize || 5
  const page = Number(req.query.pageNumber) || 1

  const count = await Link.estimatedDocumentCount({})

  const links = await Link.find({})
    .limit(parseInt(pageSize))
    .skip(pageSize * (page - 1))
    .sort([['createdAt', -1]])
    .populate('postedBy', 'name ')
    .exec((err, links) => {
      if (err) {
        return res.status(400).json({
          error: 'Could not list links',
        })
      }
      res.json({
        links,
        page,
        pages: Math.ceil(count / pageSize),
        pageSize: pageSize,
      })
    })
}

exports.read = (req, res) => {
  const { id } = req.params

  Link.findById({ _id: id }).exec((err, link) => {
    if (err) {
      return res.status(400).json({
        error: 'Link not found.',
      })
    }
    res.json(link)
  })
}

exports.update = (req, res) => {
  const { id } = req.params
  const { title, url, categories, type, medium } = req.body
  if (!title || !url || categories.length === 0 || !type || !medium) {
    return res.status(400).json({
      error: 'All fields are required.',
    })
  }

  Link.findOneAndUpdate(
    { _id: id },
    { title, url, categories, type, medium },
    { new: true }
  ).exec((err, result) => {
    if (err) {
      return res.status(400).json({
        error: err.message,
      })
    }
    res.json({ message: 'Link Updated' })
  })
}

exports.remove = async (req, res) => {
  const { id } = req.params
  Link.findByIdAndRemove({ _id: id }).exec((err, success) => {
    if (err) {
      return res.status(400).json({
        error: err.message,
      })
    }
    res.json({ message: 'Link Deleted' })
  })
}

exports.clickCount = (req, res) => {
  const { linkId } = req.body
  Link.findByIdAndUpdate(
    linkId,
    { $inc: { clicks: 1 } },
    { upsert: true, new: true }
  ).exec((err, result) => {
    if (err) {
      console.log(err)
      return res.status(400).json({
        error: 'Could not update view count',
      })
    }
    res.json(result)
  })
}

exports.popular = (req, res) => {
  Link.find()
    .populate('postedBy', 'name')
    .populate('categories', 'name')
    .sort({ clicks: -1 })
    .limit(3)
    .exec((err, links) => {
      if (err) {
        return res.status(400).json({
          error: 'Links not found',
        })
      }
      res.json(links)
    })
}

exports.popularInCategory = (req, res) => {
  const { slug } = req.params

  Category.findOne({ slug: slug }).exec((err, category) => {
    if (err) {
      return res.status(400).json({
        error: 'Could not load categories',
      })
    }

    Link.find({ categories: category })
      .sort({ clicks: -1 })
      .populate('postedBy', 'name')
      .limit(3)
      .exec((err, links) => {
        if (err) {
          return res.status(400).json({
            error: 'Links not found',
          })
        }
        res.json(links)
      })
  })
}
