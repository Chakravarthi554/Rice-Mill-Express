const { body, validationResult } = require('express-validator');

const validateForumPost = [
  body('title').isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 chars'),
  body('content').isLength({ min: 10, max: 1000 }).withMessage('Content must be 10-1000 chars'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

const validateComment = [
  body('content').isLength({ min: 1, max: 500 }).withMessage('Comment must be 1-500 chars'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

module.exports = { validateForumPost, validateComment };
