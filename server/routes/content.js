
const express = require('express');
const multer = require('multer');
const path = require('path');
const Content = require('../models/Content');
const authMiddleware = require('../middleware/auth'); // We will create this middleware next

const router = express.Router();

// Configure Multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Ensure 'uploads/' directory exists
  },
  filename: function (req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

// @route   GET api/content
// @desc    Get all content
// @access  Public
router.get('/', authMiddleware, async (req, res) => {
  try {
    const contents = await Content.find().sort({ createdAt: -1 }).populate('uploader', 'walletAddress');

    const contentsWithLikeStatus = await Promise.all(contents.map(async content => {
      let isLiked = false;
      if (req.user) {
        const like = await Like.findOne({ user: req.user.id, content: content._id });
        isLiked = !!like;
      }
      return { ...content.toObject(), isLiked };
    }));

    res.json(contentsWithLikeStatus);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route   GET api/content/:id
// @desc    Get content by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const content = await Content.findById(req.params.id).populate('uploader', 'walletAddress');
    if (!content) {
      return res.status(404).json({ msg: 'Content not found' });
    }
    res.json(content);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Content not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/content/upload
// @desc    Upload a file and its metadata
// @access  Private
router.post('/upload', [authMiddleware, upload.single('file')], async (req, res) => {
  const { title, description } = req.body;
  const { file } = req;

  if (!file) {
    return res.status(400).json({ msg: 'File is required' });
  }

  // Basic file type detection
  const fileType = file.mimetype.split('/')[0]; // 'image', 'video', 'audio'

  try {
    const newContent = new Content({
      title,
      description,
      fileType,
      filePath: file.path,
      uploader: req.user.id
    });

    const content = await newContent.save();
    res.json(content);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



const express = require('express');
const multer = require('multer');
const path = require('path');
const Content = require('../models/Content');
const Like = require('../models/Like');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Configure Multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Ensure 'uploads/' directory exists
  },
  filename: function (req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

// @route   GET api/content
// @desc    Get all content or filter by type/search
// @access  Public (with optional auth)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { type, search } = req.query;
    let query = {};

    if (type) {
      query.fileType = type;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const contents = await Content.find(query).sort({ createdAt: -1 }).populate('uploader', 'walletAddress');

    const contentsWithLikeStatus = await Promise.all(contents.map(async content => {
      let isLiked = false;
      if (req.user) {
        const like = await Like.findOne({ user: req.user.id, content: content._id });
        isLiked = !!like;
      }
      return { ...content.toObject(), isLiked };
    }));

    res.json(contentsWithLikeStatus);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route   GET api/content/:id
// @desc    Get content by ID
// @access  Public (with optional auth)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id).populate('uploader', 'walletAddress');
    if (!content) {
      return res.status(404).json({ msg: 'Content not found' });
    }

    let isLiked = false;
    if (req.user) {
      const like = await Like.findOne({ user: req.user.id, content: content._id });
      isLiked = !!like;
    }

    res.json({ ...content.toObject(), isLiked });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Content not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/content/upload
// @desc    Upload a file and its metadata
// @access  Private
router.post('/upload', [authMiddleware, upload.single('file')], async (req, res) => {
  const { title, description } = req.body;
  const { file } = req;

  if (!file) {
    return res.status(400).json({ msg: 'File is required' });
  }

  // Basic file type detection
  const fileType = file.mimetype.split('/')[0]; // 'image', 'video', 'audio'

  try {
    const newContent = new Content({
      title,
      description,
      fileType,
      filePath: file.path,
      uploader: req.user.id
    });

    const content = await newContent.save();
    res.json(content);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route   PUT api/content/like/:id
// @desc    Like or unlike a piece of content
// @access  Private
router.put('/like/:id', authMiddleware, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ msg: 'Content not found' });
    }

    // Check if the content has already been liked by this user
    const existingLike = await Like.findOne({ user: req.user.id, content: req.params.id });

    if (existingLike) {
      // Unlike
      await existingLike.remove();
      content.likes = Math.max(0, content.likes - 1); // prevent negative likes
      await content.save();
      return res.json({ msg: 'Content unliked', likes: content.likes });
    } else {
      // Like
      const newLike = new Like({
        user: req.user.id,
        content: req.params.id
      });
      await newLike.save();
      content.likes = content.likes + 1;
      await content.save();
      return res.json({ msg: 'Content liked', likes: content.likes });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
