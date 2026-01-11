const asyncHandler = require('express-async-handler');
const ForumPost = require('../models/ForumPost');
const ForumPostReport = require('../models/ForumPostReport');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const customerLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  message: 'Too many posts from this IP, please try again after 24 hours',
});

const sellerLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  message: 'Too many posts from this IP, please try again after 24 hours',
});

let badWordsFilter;
(async () => {
  try {
    const { Filter } = await import('bad-words');
    badWordsFilter = new Filter();
  } catch (error) {
    console.error('Failed to initialize bad-words filter:', error);
    badWordsFilter = { isProfane: () => false };
  }
})();

// ✅ FIXED: Enhanced create post with real-time events
const createPost = asyncHandler(async (req, res) => {
  try {
    const { title, content, category, tags, linkedRecipe, linkedProduct } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    if (title.length > 100 || content.length > 1000) {
      return res.status(400).json({ message: 'Title must be <= 100 chars, content <= 1000 chars' });
    }

    if (badWordsFilter.isProfane(title) || badWordsFilter.isProfane(content)) {
      return res.status(400).json({ message: 'Content contains inappropriate language' });
    }

    const status = req.user.role === 'customer' ? 'pending' : 'approved';
    const postData = {
      title,
      content,
      userId: req.user._id,
      category: category || 'General',
      tags: tags || [],
      status,
    };

    if (linkedRecipe && mongoose.Types.ObjectId.isValid(linkedRecipe)) {
      postData.linkedRecipe = linkedRecipe;
    }
    if (linkedProduct && mongoose.Types.ObjectId.isValid(linkedProduct)) {
      postData.linkedProduct = linkedProduct;
    }

    const post = await ForumPost.create(postData);
    const populatedPost = await ForumPost.findById(post._id)
      .populate('userId', 'name profilePic')
      .populate('linkedRecipe', 'name')
      .populate('linkedProduct', 'name');

    // 🔥 ENHANCED: Real-time socket events
    if (req.io) {
      // Notify all admins about new pending post
      if (status === 'pending') {
        req.io.to('admin_room').emit('NEW_POST_NEEDS_APPROVAL', {
          postId: post._id,
          userId: req.user._id,
          userName: req.user.name,
          title: title,
          content: content.substring(0, 100) + '...',
          timestamp: new Date()
        });
      } else {
        // Notify all users about new approved post
        req.io.emit('NEW_FORUM_POST', {
          post: populatedPost,
          message: `New post in ${category}: ${title}`
        });
      }

      console.log(`✅ Post created and socket events emitted for post ${post._id}`);
    }

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      message: 'Error creating post',
      error: error.message
    });
  }
});

// ✅ FIXED: Enhanced get posts with better filtering
const getPosts = asyncHandler(async (req, res) => {
  try {
    const { category, search, tags, status = 'approved', page = 1, limit = 50 } = req.query;
    let query = {};

    // 🔥 CRITICAL FIX: Admin can see all posts, others only approved
    if (req.user && req.user.role === 'admin') {
      if (status && status !== 'all') {
        query.status = status;
      }
    } else {
      query.status = 'approved';
    }

    if (category && category !== 'all') query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    if (tags) query.tags = { $in: tags.split(',') };

    const skip = (page - 1) * limit;
    const posts = await ForumPost.find(query)
      .populate('userId', 'name profilePic')
      .populate('linkedRecipe', 'name image')
      .populate('linkedProduct', 'name images')
      .sort({ pinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await ForumPost.countDocuments(query);

    res.json({
      posts,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error in getPosts:', error);
    res.status(500).json({ message: 'Server error fetching posts', error: error.message });
  }
});

// ✅ FIXED: Enhanced get pending posts with better admin validation
const getPendingPosts = asyncHandler(async (req, res) => {
  try {
    console.log(`🔄 getPendingPosts: Admin user = ${req.user?._id}, role = ${req.user?.role}`);

    if (!req.user) {
      console.error('❌ getPendingPosts: No user in request!');
      return res.status(401).json({
        message: 'Not authenticated',
        code: 'AUTH_REQUIRED'
      });
    }

    if (req.user.role !== 'admin') {
      console.error(`❌ getPendingPosts: Access denied for role: ${req.user.role}`);
      return res.status(403).json({
        message: 'Access denied. Admin role required.',
        userRole: req.user.role,
        code: 'ADMIN_ACCESS_REQUIRED'
      });
    }

    const { category, search, tags, page = 1, limit = 10 } = req.query;
    const query = { status: 'pending' };

    if (category && category !== 'all') query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    if (tags) query.tags = { $in: tags.split(',') };

    const skip = (page - 1) * limit;
    const posts = await ForumPost.find(query)
      .populate('userId', 'name profilePic email')
      .populate('linkedRecipe', 'name')
      .populate('linkedProduct', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await ForumPost.countDocuments(query);

    console.log(`✅ getPendingPosts: Found ${posts.length} pending posts for admin ${req.user._id}`);

    res.json({
      posts,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('❌ Error in getPendingPosts:', error);
    res.status(500).json({
      message: 'Server error fetching pending posts',
      error: error.message,
      code: 'SERVER_ERROR'
    });
  }
});

// ✅ FIXED: Enhanced get post by ID with better error handling
const getPostById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // If the caller mistakenly used the status word, redirect to the list endpoint
    if (id === 'pending') {
      return getPendingPosts(req, res);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await ForumPost.findById(id)
      .populate('userId', 'name profilePic')
      .populate('linkedRecipe', 'name image ingredients')
      .populate('linkedProduct', 'name images price')
      .populate({
        path: 'comments.userId',
        select: 'name profilePic'
      });

    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Hide non-approved posts from non-admins
    if (post.status !== 'approved' && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Post not available' });
    }

    // Filter comments for non-admins
    if (!req.user || req.user.role !== 'admin') {
      post.comments = post.comments.filter(c => c.approved && !c.isFlagged);
    }

    res.json(post);
  } catch (error) {
    console.error('Error in getPostById:', error);
    res.status(500).json({ message: 'Server error fetching post', error: error.message });
  }
});

// ✅ FIXED: Enhanced reply to post with real-time updates
const replyToPost = asyncHandler(async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Content is required' });
    }

    if (badWordsFilter.isProfane(content)) {
      return res.status(400).json({ message: 'Reply contains inappropriate language' });
    }

    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Auto-approve comments for sellers and admins, require approval for customers
    const approved = req.user.role !== 'customer';

    const newComment = {
      userId: req.user._id,
      text: content.trim(),
      approved: approved,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Use atomic update to avoid version conflicts
    const updatedPost = await ForumPost.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: newComment
        },
        $set: {
          updatedAt: new Date()
        }
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('comments.userId', 'name profilePic')
      .populate('userId', 'name profilePic');

    if (!updatedPost) {
      return res.status(404).json({ message: 'Post not found after update' });
    }

    // Get the newly added comment (last one in the array)
    const addedComment = updatedPost.comments[updatedPost.comments.length - 1];

    // 🔥 ENHANCED: Real-time socket events for comments
    if (req.io) {
      // Notify all users in the post room
      req.io.to(`post_${post._id}`).emit('POST_COMMENTED', {
        postId: post._id,
        comment: addedComment,
        postTitle: post.title
      });

      // Notify admin if comment needs approval
      if (!approved) {
        req.io.to('admin_room').emit('NEW_COMMENT_NEEDS_APPROVAL', {
          postId: post._id,
          commentId: addedComment._id,
          userId: req.user._id,
          userName: req.user.name,
          content: content.trim(),
          timestamp: new Date()
        });
      }

      // Emit social update for real-time sync
      req.io.emit('SOCIAL_UPDATE', {
        type: 'COMMENT',
        itemType: 'forum',
        itemId: post._id,
        userId: req.user._id,
        comment: addedComment,
        needsApproval: !approved,
        timestamp: new Date()
      });

      console.log(`✅ Comment emitted via socket for post ${post._id}`);
    }

    res.json(addedComment);
  } catch (error) {
    console.error('Error in replyToPost:', error);
    res.status(500).json({
      message: 'Server error adding comment',
      error: error.message
    });
  }
});

// ✅ FIXED: Enhanced like post with real-time updates
const likePost = asyncHandler(async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userId = req.user._id.toString();
    const index = post.likes.indexOf(userId);

    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();

    // 🔥 ENHANCED: Real-time socket events for likes
    if (req.io) {
      req.io.to(`post_${post._id}`).emit('POST_LIKED', {
        postId: post._id,
        likes: post.likes,
        likesCount: post.likes.length,
        userId: userId,
        action: index === -1 ? 'liked' : 'unliked'
      });

      // Emit social update for real-time sync
      req.io.emit('SOCIAL_UPDATE', {
        type: 'LIKE',
        itemType: 'forum',
        itemId: post._id,
        userId: userId,
        likes: post.likes,
        likesCount: post.likes.length,
        action: index === -1 ? 'liked' : 'unliked',
        timestamp: new Date()
      });

      console.log(`❤️ Like emitted via socket for post ${post._id}`);
    }

    res.json({
      ...post.toObject(),
      userLiked: index === -1,
      likesCount: post.likes.length
    });
  } catch (error) {
    console.error('Error in likePost:', error);
    res.status(500).json({ message: 'Server error liking post', error: error.message });
  }
});

// ✅ FIXED: Enhanced approve post with real-time notifications
const approvePost = asyncHandler(async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const post = await ForumPost.findByIdAndUpdate(
      req.params.id,
      {
        status: status,
        isFlagged: false
      },
      { new: true }
    )
      .populate('userId', 'name profilePic email')
      .populate('linkedRecipe', 'name')
      .populate('linkedProduct', 'name');

    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Create notification for the post owner
    await Notification.create({
      user: post.userId,
      type: 'SYSTEM',
      message: status === 'approved'
        ? `Your post "${post.title}" has been approved and is now visible to everyone.`
        : `Your post "${post.title}" has been rejected.`,
      relatedEntity: post._id,
      entityModel: 'ForumPost',
    });

    // 🔥 ENHANCED: Real-time socket events for post approval
    if (req.io) {
      req.io.emit('POST_STATUS_CHANGED', {
        postId: post._id,
        status: post.status,
        post: post
      });

      // Notify the post owner
      req.io.to(`user_${post.userId._id}`).emit('POST_STATUS_NOTIFICATION', {
        postId: post._id,
        status: post.status,
        title: post.title
      });

      // If approved, notify all users about the new post
      if (status === 'approved') {
        req.io.emit('NEW_FORUM_POST', {
          post: post,
          message: `New post in ${post.category}: ${post.title}`
        });
      }

      console.log(`✅ Post status changed to ${status} for post ${post._id}`);
    }

    res.json(post);
  } catch (error) {
    console.error('Error in approvePost:', error);
    res.status(500).json({ message: 'Server error approving post', error: error.message });
  }
});

// ✅ ENHANCED: Comprehensive report post with detailed tracking
const reportPost = asyncHandler(async (req, res) => {
  try {
    const {
      reportReason,
      reportCategory,
      additionalDetails,
      isAnonymous = false,
      severity = 'medium'
    } = req.body;

    // 🔥 Enhanced debug logging
    console.log('📝 Report submission - Full request body:', req.body);
    console.log('📝 Report details:', {
      postId: req.params.id,
      userId: req.user?._id,
      reportReason,
      reportCategory,
      severity,
      additionalDetails: additionalDetails?.substring(0, 50)
    });

    // Validate required fields
    if (!reportReason || !reportCategory) {
      console.log('❌ Validation failed - Missing fields:', {
        hasReason: !!reportReason,
        hasCategory: !!reportCategory,
        receivedReason: reportReason,
        receivedCategory: reportCategory
      });
      return res.status(400).json({
        message: 'Report reason and category are required',
        missingFields: {
          reportReason: !reportReason,
          reportCategory: !reportCategory
        }
      });
    }

    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Check for duplicate report
    console.log('🔍 Checking for duplicate report...');
    const existingReport = await ForumPostReport.findOne({
      postId: req.params.id,
      reportedBy: req.user._id
    });

    if (existingReport) {
      console.log('⚠️ Duplicate report detected:', existingReport._id);
      return res.status(400).json({
        message: 'You have already reported this post',
        reportId: existingReport._id,
        isDuplicate: true
      });
    }
    console.log('✅ No duplicate found, proceeding with report creation');

    // Rate limiting check - max 5 reports per day per user
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const userReportsToday = await ForumPostReport.countDocuments({
      reportedBy: req.user._id,
      createdAt: { $gte: today }
    });

    if (userReportsToday >= 5) {
      return res.status(429).json({
        message: 'You have reached the maximum number of reports for today. Please try again tomorrow.',
        limit: 5,
        resetTime: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      });
    }

    // Create detailed report
    const report = await ForumPostReport.create({
      postId: req.params.id,
      reportedBy: req.user._id,
      reportReason: reportReason || 'Other',
      reportCategory: reportCategory || 'other',
      additionalDetails,
      isAnonymous,
      severity,
      reporterIp: req.ip || req.connection.remoteAddress
    });

    // Update post reports array and count
    if (!post.reports.includes(req.user._id)) {
      post.reports.push(req.user._id);
      post.reportCount = post.reports.length;

      // Auto-flag after 5 reports
      if (post.reports.length >= 5) {
        post.isFlagged = true;
      }

      // Auto-hide after 10 reports (pending admin review)
      if (post.reports.length >= 10 && post.status === 'approved') {
        post.status = 'pending';
      }

      await post.save();
    }

    // Create notification for admins
    const adminUsers = await require('../models/User').find({ role: 'admin' });
    const notificationPromises = adminUsers.map(admin =>
      Notification.create({
        user: admin._id,
        type: 'SYSTEM',
        title: `New ${severity.toUpperCase()} Report`,
        message: `New ${severity} severity report on post: "${post.title.substring(0, 50)}..."`,
        relatedEntity: report._id,
        entityModel: 'ForumPostReport',
      })
    );
    await Promise.all(notificationPromises);

    // 🔥 Real-time socket notification to admins
    if (req.io) {
      req.io.to('admin_room').emit('NEW_POST_REPORT', {
        reportId: report._id,
        postId: post._id,
        postTitle: post.title,
        reportReason,
        reportCategory,
        severity,
        reportedBy: isAnonymous ? 'Anonymous' : req.user.name,
        timestamp: new Date(),
        reportCount: post.reports.length,
        isFlagged: post.isFlagged
      });

      console.log(`⚠️ New report submitted for post ${post._id}`);
    }

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Our team will review it shortly.',
      reportId: report._id,
      reportCount: post.reports.length
    });
  } catch (error) {
    console.error('Error in reportPost:', error);
    res.status(500).json({
      message: 'Server error reporting post',
      error: error.message
    });
  }
});

const deletePost = asyncHandler(async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Check permissions
    if (req.user.role !== 'admin' && post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await ForumPost.deleteOne({ _id: req.params.id });

    // Enhanced socket event for real-time updates
    if (req.io) {
      req.io.emit('POST_DELETED', {
        postId: req.params.id,
        deletedBy: req.user._id
      });

      console.log(`🗑️ Post deleted: ${req.params.id}`);
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error in deletePost:', error);
    res.status(500).json({ message: 'Server error deleting post', error: error.message });
  }
});

const pinPost = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.pinned = !post.pinned;
    await post.save();

    // Socket event for pin/unpin
    if (req.io) {
      req.io.emit('POST_PINNED', {
        postId: post._id,
        pinned: post.pinned
      });
    }

    res.json(post);
  } catch (error) {
    console.error('Error in pinPost:', error);
    res.status(500).json({ message: 'Server error pinning post', error: error.message });
  }
});

// Moderate forum comment
const moderateComment = asyncHandler(async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { action } = req.body; // 'approve', 'reject', 'delete'

    if (!['approve', 'reject', 'delete'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const post = await ForumPost.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (action === 'approve') {
      comment.approved = true;
      comment.isFlagged = false;
    } else if (action === 'reject') {
      comment.approved = false;
    } else if (action === 'delete') {
      post.comments.pull({ _id: commentId });
    }

    await post.save();

    // Enhanced socket event for real-time updates
    if (req.io) {
      req.io.emit('COMMENT_MODERATED', {
        postId: post._id,
        commentId: commentId,
        action: action
      });

      // Notify the comment author if approved
      if (action === 'approve') {
        req.io.to(`user_${comment.userId}`).emit('COMMENT_APPROVED', {
          postId: post._id,
          commentId: commentId,
          postTitle: post.title
        });
      }

      console.log(`✅ Comment ${action}d: ${commentId} in post ${postId}`);
    }

    res.json({
      message: `Comment ${action}d successfully`,
      post: await ForumPost.findById(postId).populate('comments.userId', 'name profilePic')
    });
  } catch (error) {
    console.error('Error in moderateComment:', error);
    res.status(500).json({ message: 'Server error moderating comment', error: error.message });
  }
});

// Report forum comment
const reportComment = asyncHandler(async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { reason } = req.body;

    const post = await ForumPost.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // Check if user already reported this comment
    const alreadyReported = comment.reports.some(report =>
      report.userId.toString() === req.user._id.toString()
    );

    if (!alreadyReported) {
      comment.reports.push({
        userId: req.user._id,
        reason: reason || 'Inappropriate content',
        createdAt: new Date()
      });

      // Flag comment if it has 3 or more reports
      comment.isFlagged = comment.reports.length >= 3;

      await post.save();

      // Notify admin if comment gets flagged
      if (comment.isFlagged && req.io) {
        req.io.to('admin_room').emit('COMMENT_FLAGGED', {
          postId: post._id,
          commentId: commentId,
          reportsCount: comment.reports.length,
          reason: reason
        });
      }
    }

    res.json({ message: 'Comment reported successfully', comment });
  } catch (error) {
    console.error('Error in reportComment:', error);
    res.status(500).json({ message: 'Server error reporting comment', error: error.message });
  }
});

// Get all flagged comments for admin
const getFlaggedComments = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Find posts that have flagged comments
    const posts = await ForumPost.find({
      'comments.isFlagged': true
    })
      .populate('userId', 'name email')
      .populate('comments.userId', 'name profilePic')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Extract flagged comments with post info
    const flaggedComments = [];
    posts.forEach(post => {
      post.comments.forEach(comment => {
        if (comment.isFlagged) {
          flaggedComments.push({
            ...comment,
            postId: post._id,
            postTitle: post.title,
            postAuthor: post.userId
          });
        }
      });
    });

    const total = await ForumPost.countDocuments({
      'comments.isFlagged': true
    });

    res.json({
      comments: flaggedComments,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error in getFlaggedComments:', error);
    res.status(500).json({ message: 'Server error fetching flagged comments', error: error.message });
  }
});

// Get post statistics for admin dashboard
const getPostStats = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const [
      totalPosts,
      pendingPosts,
      approvedPosts,
      flaggedPosts,
      totalComments,
      pendingComments,
      flaggedComments
    ] = await Promise.all([
      ForumPost.countDocuments(),
      ForumPost.countDocuments({ status: 'pending' }),
      ForumPost.countDocuments({ status: 'approved' }),
      ForumPost.countDocuments({ isFlagged: true }),
      ForumPost.aggregate([{ $project: { commentsCount: { $size: '$comments' } } }]),
      ForumPost.countDocuments({ 'comments.approved': false }),
      ForumPost.countDocuments({ 'comments.isFlagged': true })
    ]);

    const totalCommentsCount = totalComments.reduce((sum, post) => sum + (post.commentsCount || 0), 0);

    res.json({
      totalPosts,
      pendingPosts,
      approvedPosts,
      flaggedPosts,
      totalComments: totalCommentsCount,
      pendingComments,
      flaggedComments
    });
  } catch (error) {
    console.error('Error in getPostStats:', error);
    res.status(500).json({ message: 'Server error fetching post statistics', error: error.message });
  }
});

// Get recent forum activity
const getRecentActivity = asyncHandler(async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const recentPosts = await ForumPost.find({ status: 'approved' })
      .populate('userId', 'name profilePic')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('title userId createdAt likes comments')
      .lean();

    const recentComments = await ForumPost.aggregate([
      { $unwind: '$comments' },
      { $match: { 'comments.approved': true } },
      { $sort: { 'comments.createdAt': -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: 'comments.userId',
          foreignField: '_id',
          as: 'commentUser'
        }
      },
      {
        $project: {
          postId: '$_id',
          postTitle: '$title',
          comment: '$comments.text',
          commentId: '$comments._id',
          userId: { $arrayElemAt: ['$commentUser._id', 0] },
          userName: { $arrayElemAt: ['$commentUser.name', 0] },
          userProfilePic: { $arrayElemAt: ['$commentUser.profilePic', 0] },
          createdAt: '$comments.createdAt'
        }
      }
    ]);

    res.json({
      recentPosts,
      recentComments
    });
  } catch (error) {
    console.error('Error in getRecentActivity:', error);
    res.status(500).json({ message: 'Server error fetching recent activity', error: error.message });
  }
});

const getAdminStats = asyncHandler(async (req, res) => {
  try {
    // Enhanced admin check
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Admin access required',
        userRole: req.user.role
      });
    }

    const [totalUsers, totalOrders] = await Promise.all([
      require('../models/User').countDocuments({ role: { $nin: ['search_log'] } }),
      require('../models/Order').countDocuments()
    ]);

    res.json({
      totalUsers,
      totalOrders,
      pendingKyc: await require('../models/KycApplication').countDocuments({ status: 'under_review' })
    });
  } catch (error) {
    console.error('getAdminStats error:', error);
    res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
});

// ✅ NEW: Get all reports (Admin only)
const getReports = asyncHandler(async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const {
      status,
      severity,
      category,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (severity && severity !== 'all') query.severity = severity;
    if (category && category !== 'all') query.reportCategory = category;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const reports = await ForumPostReport.find(query)
      .populate('postId', 'title content userId category')
      .populate('reportedBy', 'name email profilePic')
      .populate('reviewedBy', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await ForumPostReport.countDocuments(query);

    res.json({
      reports,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error in getReports:', error);
    res.status(500).json({ message: 'Server error fetching reports', error: error.message });
  }
});

// ✅ NEW: Get single report details (Admin only)
const getReportById = asyncHandler(async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const report = await ForumPostReport.findById(req.params.reportId)
      .populate('postId')
      .populate('reportedBy', 'name email profilePic')
      .populate('reviewedBy', 'name email')
      .populate({
        path: 'postId',
        populate: { path: 'userId', select: 'name email profilePic' }
      });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Get post author's report history
    const authorReports = await ForumPostReport.find({
      'postId.userId': report.postId?.userId?._id
    }).countDocuments();

    // Get other reports on this post
    const postReports = await ForumPostReport.find({
      postId: report.postId?._id,
      _id: { $ne: report._id }
    })
      .populate('reportedBy', 'name')
      .select('reportReason severity createdAt')
      .lean();

    res.json({
      report,
      authorReportHistory: authorReports,
      otherReportsOnPost: postReports
    });
  } catch (error) {
    console.error('Error in getReportById:', error);
    res.status(500).json({ message: 'Server error fetching report', error: error.message });
  }
});

// ✅ NEW: Take action on report (Admin only)
const takeReportAction = asyncHandler(async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { action, adminNotes, banDuration } = req.body;
    const validActions = ['warning_sent', 'post_removed', 'user_banned_temp', 'user_banned_permanent', 'dismissed'];

    if (!validActions.includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const report = await ForumPostReport.findById(req.params.reportId)
      .populate('postId')
      .populate('reportedBy', 'name email');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Update report
    report.status = action === 'dismissed' ? 'dismissed' : 'resolved';
    report.adminAction = action;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    report.actionTakenAt = new Date();
    if (adminNotes) report.adminNotes = adminNotes;

    // Handle ban duration
    if (action.includes('banned') && banDuration) {
      report.banDuration = banDuration;
      if (banDuration > 0) {
        report.banExpiresAt = new Date(Date.now() + banDuration * 24 * 60 * 60 * 1000);
      }
    }

    await report.save();

    const post = report.postId;
    const postAuthor = post?.userId;

    // Execute action
    let notificationMessage = '';

    switch (action) {
      case 'warning_sent':
        notificationMessage = `Warning: Your post "${post.title}" has been flagged for violating community guidelines. Reason: ${report.reportReason}.`;
        break;

      case 'post_removed':
        if (post) {
          await ForumPost.findByIdAndUpdate(post._id, {
            status: 'rejected',
            isFlagged: true
          });
        }
        notificationMessage = `Your post "${post.title}" has been removed for violating community guidelines. Reason: ${report.reportReason}.`;
        break;

      case 'user_banned_temp':
        // Implement user ban logic here
        notificationMessage = `Your account has been temporarily suspended for ${banDuration} days due to community guideline violations.`;
        break;

      case 'user_banned_permanent':
        // Implement permanent ban logic here
        notificationMessage = `Your account has been permanently suspended due to severe community guideline violations.`;
        break;

      case 'dismissed':
        // Notify reporter that report was reviewed but dismissed
        if (!report.isAnonymous) {
          await Notification.create({
            user: report.reportedBy._id,
            type: 'SYSTEM',
            message: `Your report on post "${post.title}" has been reviewed. No action was taken as it did not violate our guidelines.`,
          });
        }
        break;
    }

    // Send notification to post author (except for dismissed)
    if (action !== 'dismissed' && postAuthor) {
      await Notification.create({
        user: postAuthor,
        type: 'SYSTEM',
        message: notificationMessage,
        relatedEntity: post._id,
        entityModel: 'ForumPost',
      });

      // Real-time socket notification
      if (req.io) {
        req.io.to(`user_${postAuthor}`).emit('REPORT_ACTION_TAKEN', {
          action,
          postId: post._id,
          message: notificationMessage
        });
      }
    }

    // Notify admins
    if (req.io) {
      req.io.to('admin_room').emit('REPORT_RESOLVED', {
        reportId: report._id,
        action,
        postId: post._id
      });
    }

    res.json({
      success: true,
      message: `Action "${action}" completed successfully`,
      report
    });
  } catch (error) {
    console.error('Error in takeReportAction:', error);
    res.status(500).json({ message: 'Server error taking action', error: error.message });
  }
});

// ✅ NEW: Get report statistics (Admin only)
const getReportStats = asyncHandler(async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const stats = await ForumPostReport.getStats();

    res.json(stats);
  } catch (error) {
    console.error('Error in getReportStats:', error);
    res.status(500).json({ message: 'Server error fetching stats', error: error.message });
  }
});

// ✅ NEW: Bookmark/Unbookmark post
const bookmarkPost = asyncHandler(async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userId = req.user._id.toString();
    const index = post.bookmarkedBy.findIndex(id => id.toString() === userId);

    let isBookmarked;
    if (index === -1) {
      post.bookmarkedBy.push(userId);
      isBookmarked = true;
    } else {
      post.bookmarkedBy.splice(index, 1);
      isBookmarked = false;
    }

    await post.save();

    res.json({
      success: true,
      isBookmarked,
      bookmarkCount: post.bookmarkedBy.length
    });
  } catch (error) {
    console.error('Error in bookmarkPost:', error);
    res.status(500).json({ message: 'Server error bookmarking post', error: error.message });
  }
});

// ✅ NEW: Get user's bookmarked posts
const getUserBookmarks = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await ForumPost.find({
      bookmarkedBy: req.user._id,
      status: 'approved'
    })
      .populate('userId', 'name profilePic')
      .populate('linkedRecipe', 'name')
      .populate('linkedProduct', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await ForumPost.countDocuments({
      bookmarkedBy: req.user._id,
      status: 'approved'
    });

    res.json({
      posts,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error in getUserBookmarks:', error);
    res.status(500).json({ message: 'Server error fetching bookmarks', error: error.message });
  }
});

module.exports = {
  createPost,
  getPosts,
  getPendingPosts,
  getPostById,
  replyToPost,
  likePost,
  approvePost,
  reportPost,
  deletePost,
  pinPost,
  moderateComment,
  reportComment,
  getFlaggedComments,
  getPostStats,
  getRecentActivity,
  getAdminStats,
  // New report management functions
  getReports,
  getReportById,
  takeReportAction,
  getReportStats,
  // Bookmark functions
  bookmarkPost,
  getUserBookmarks,
  customerLimiter,
  sellerLimiter
};