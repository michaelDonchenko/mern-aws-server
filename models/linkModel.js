const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema

const linkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
      unique: [true, 'Link Title has to be unique'],
      max: 500,
    },
    url: {
      type: String,
      trim: true,
      required: true,
      unique: [true, 'Link url has to be unique'],
      max: 500,
    },
    slug: {
      type: String,
      lowercase: true,
      required: true,
      index: true,
    },
    postedBy: {
      type: ObjectId,
      ref: 'User',
    },
    categories: [
      {
        type: ObjectId,
        ref: 'Category',
        required: true,
      },
    ],
    type: {
      type: String,
      default: 'Free',
    },
    medium: {
      type: String,
      default: 'Video',
    },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Link', linkSchema)
