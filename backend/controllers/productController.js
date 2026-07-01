// [AI: Array handling for new seller product form fields]
const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const User = require('../models/User');
const Notification = require('../models/Notification'); // ✅ ADDED

// ✅ FIXED: Enhanced getProducts with better error handling
const getProducts = asyncHandler(async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;

    const keyword = req.query.keyword
      ? {
        name: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
      : {};

    const query = { ...keyword, approvalStatus: 'approved' };

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
      .select('name brand category price offerPrice images rating numReviews countInStock availableStock weight unit approvalStatus type quality')
      .populate('seller', 'name businessName')
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
      hasMore: page < Math.ceil(count / pageSize)
    });
  } catch (error) {
    console.error('❌ Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// ✅ FIXED: Enhanced filterProducts with proper validation
const filterProducts = asyncHandler(async (req, res) => {
  try {
    const {
      search,
      category,
      type,
      quality,
      weight,
      priceMin = 0,
      priceMax = 10000,
      dietPreference,
      cookingPurpose,
      sellerLocation,
      deliveryOptions,
      ratings,
      discounts,
      stockAvailability,
      brand,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query object
    const query = {};

    // Text search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by brand
    if (brand) {
      const brands = Array.isArray(brand) ? brand : brand.split(',');
      query.brand = { $in: brands };
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by quality
    if (quality) {
      query.quality = quality;
    }

    // Filter by weight
    if (weight) {
      query.weight = weight;
    }

    // Price range
    query.price = {
      $gte: Number(priceMin),
      $lte: Number(priceMax)
    };

    // Diet preference (array)
    if (dietPreference) {
      const diets = Array.isArray(dietPreference) ? dietPreference : dietPreference.split(',');
      query.dietPreference = { $in: diets };
    }

    // Cooking purpose (array)
    if (cookingPurpose) {
      const purposes = Array.isArray(cookingPurpose) ? cookingPurpose : cookingPurpose.split(',');
      query.cookingPurpose = { $in: purposes };
    }

    // Seller location
    if (sellerLocation) {
      // NOTE: Product schema has seller ObjectId, not seller.location. 
      // But we leave this check here in case it's implemented via aggregation later.
      // query['seller.location'] = { $regex: sellerLocation, $options: 'i' };
    }

    // Delivery options (array)
    if (deliveryOptions) {
      const options = Array.isArray(deliveryOptions) ? deliveryOptions : deliveryOptions.split(',');
      query.deliveryOptions = { $in: options };
    }

    // Minimum rating
    if (ratings) {
      query.rating = { $gte: Number(ratings) };
    }

    // Discounts (sale items)
    if (discounts === 'true' || discounts === true) {
      query.$expr = { $lt: ["$offerPrice", "$price"] };
    } else if (discounts) {
      query.discounts = discounts;
    }

    // Stock availability
    if (stockAvailability) {
      if (stockAvailability === 'in-stock') {
        query.countInStock = { $gt: 0 };
      } else if (stockAvailability === 'out-of-stock') {
        query.countInStock = { $lte: 0 };
      }
    } else {
      // Ensure we only show available products by default
      query.countInStock = { $gte: 1 };
    }
    
    // Only show approved products
    query.approvalStatus = 'approved';

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const products = await Product.find(query)
      .select('name brand category price offerPrice images rating numReviews countInStock availableStock weight unit approvalStatus type quality discounts')
      .populate('seller', 'name businessName phone rating')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Product.countDocuments(query);

    console.log(`✅ Found ${products.length} products out of ${total} total`);

    res.json({
      success: true,
      products: products,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      limit: Number(limit),
      filters: {
        search,
        category,
        priceRange: [Number(priceMin), Number(priceMax)]
      }
    });

  } catch (error) {
    console.error('❌ Product filter error:', error);
    res.status(500).json({
      success: false,
      message: 'Error filtering products',
      error: error.message
    });
  }
});

// ✅ FIXED: Enhanced getProductById with better error handling
const getProductById = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name businessName businessDetails phone rating');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count
    product.views = (product.views || 0) + 1;
    await product.save();

    res.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('❌ Get product by ID error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// ✅ FIXED: Enhanced createProduct with validation
const createProduct = asyncHandler(async (req, res) => {
  try {
    console.log('🔄 Creating product with data:', req.body);
    console.log('📁 Files received:', req.files);

    const {
      name,
      brand,
      category,
      description,
      price,
      offerPrice,
      countInStock,
      weight,
      unit,
      nutritionalInfo,
      certifications,
      type,
      quality,
      dietPreference,
      cookingPurpose,
      minBulkQuantity = 50
    } = req.body;

    // Validation
    if (!name || !brand || !category || !description || !price || !countInStock || !weight) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields'
      });
    }

    // Handle images
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `/uploads/${file.filename}`);
    } else if (req.body.images) {
      images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    // Parse nutritional info if it's a string
    let parsedNutritionalInfo = {};
    if (nutritionalInfo) {
      try {
        parsedNutritionalInfo = typeof nutritionalInfo === 'string'
          ? JSON.parse(nutritionalInfo)
          : nutritionalInfo;
      } catch (e) {
        console.warn('⚠️ Could not parse nutritional info:', e.message);
      }
    }

    // Parse certifications if it's a string
    let parsedCertifications = [];
    if (certifications) {
      try {
        parsedCertifications = typeof certifications === 'string'
          ? JSON.parse(certifications)
          : certifications;
      } catch (e) {
        console.warn('⚠️ Could not parse certifications:', e.message);
      }
    }

    const product = new Product({
      seller: req.user._id,
      name,
      images,
      brand,
      category,
      description,
      price: Number(price),
      offerPrice: offerPrice ? Number(offerPrice) : undefined,
      countInStock: Number(countInStock),
      stock: Number(countInStock), // Sync with countInStock
      weight: Number(weight),
      unit: unit || 'kg',
      nutritionalInfo: parsedNutritionalInfo,
      certifications: parsedCertifications,
      type,
      quality,
      dietPreference: Array.isArray(dietPreference) ? dietPreference : (dietPreference ? [dietPreference] : []),
      cookingPurpose: Array.isArray(cookingPurpose) ? cookingPurpose : (cookingPurpose ? [cookingPurpose] : []),
      minBulkQuantity: Number(minBulkQuantity),
      approvalStatus: 'pending'
    });

    const createdProduct = await product.save();

    // Populate seller info for response
    await createdProduct.populate('seller', 'name businessName');

    console.log('✅ Product created successfully:', createdProduct._id);

    // Notify Admins
    try {
      const { emailQueue } = require('../jobs/queues');
      const admins = await User.find({ role: 'admin' }).select('email _id');
      
      const adminEmails = admins.map(a => a.email).filter(Boolean);
      
      if (adminEmails.length > 0) {
        // Send email to first admin (or map through them)
        for (const email of adminEmails) {
          await emailQueue.add({
            email,
            subject: 'New Product Pending Approval',
            message: `
              <h2>New Product Awaiting Approval</h2>
              <p>Seller <b>${req.user.name}</b> has added a new product: <b>${name}</b>.</p>
              <p>Please log in to the Admin Dashboard to review and approve/reject it.</p>
            `
          });
        }
      }

      // Create in-app notifications for admins
      for (const admin of admins) {
        await Notification.create({
          user: admin._id,
          type: 'PRODUCT_APPROVAL_REQUIRED',
          message: `New product "${name}" by ${req.user.name} requires approval.`,
          relatedEntity: createdProduct._id,
          entityModel: 'Product'
        });
      }
    } catch (notifErr) {
      console.error('Failed to notify admin about new product:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: createdProduct
    });

  } catch (error) {
    console.error('❌ Create product error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
});

// ✅ FIXED: Enhanced updateProduct
const updateProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user owns the product or is admin
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    const updates = { ...req.body };

    // Handle images
    if (req.files && req.files.length > 0) {
      updates.images = req.files.map(file => `/uploads/${file.filename}`);
    }

    // Sync stock with countInStock
    if (updates.countInStock !== undefined) {
      updates.stock = updates.countInStock;
    }

    // Update product
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'seller') {
        product[key] = updates[key];
      }
    });

    const updatedProduct = await product.save();
    await updatedProduct.populate('seller', 'name businessName');

    console.log('✅ Product updated successfully:', updatedProduct._id);

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('❌ Update product error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
});

// ✅ FIXED: Enhanced deleteProduct
const deleteProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user owns the product or is admin
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    console.log('✅ Product deleted successfully:', req.params.id);

    res.json({
      success: true,
      message: 'Product removed successfully'
    });

  } catch (error) {
    console.error('❌ Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
});

// ✅ FIXED: Enhanced createProductReview
// createProductReview removed - consolidated into socialController.rateItem

// ✅ FIXED: Enhanced getSellerProducts
const getSellerProducts = asyncHandler(async (req, res) => {
  try {
    console.log('🔄 Fetching seller products for:', req.user._id);

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({ seller: req.user._id })
      .select('name brand category price offerPrice images rating numReviews countInStock availableStock weight unit approvalStatus type quality')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Product.countDocuments({ seller: req.user._id });

    console.log(`✅ Found ${products.length} products for seller ${req.user._id}`);

    res.json({
      success: true,
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    });

  } catch (error) {
    console.error('❌ Get seller products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching seller products',
      error: error.message
    });
  }
});

const bulkUploadProducts = asyncHandler(async (req, res) => {
  const { fileUrl } = req.body;
  // Implement bulk upload logic
  res.json({ message: 'Bulk upload successful' });
});

const getProductAnalytics = asyncHandler(async (req, res) => {
  res.json({ analytics: {} });
});

const getRecipeSuggestion = asyncHandler(async (req, res) => {
  const { riceType } = req.query;
  res.json({ recipes: [] });
});

const getPendingProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find({ approvalStatus: 'pending' })
      .populate('seller', 'name email phone businessName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('❌ Get pending products error:', error);
    res.status(500).json({ success: false, message: 'Error fetching pending products' });
  }
});

const approveProduct = asyncHandler(async (req, res) => {
  try {
    const { status, reason } = req.body;
    const product = await Product.findById(req.params.id).populate('seller', 'name email');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    product.approvalStatus = status;
    if (status === 'rejected') {
      product.approvalRejectionReason = reason || 'No reason provided';
    } else {
      product.approvalRejectionReason = undefined;
    }

    await product.save();

    // Notify seller
    try {
      const { emailQueue } = require('../jobs/queues');
      const seller = product.seller;
      
      if (seller && seller.email) {
        await emailQueue.add({
          email: seller.email,
          subject: `Product ${status === 'approved' ? 'Approved' : 'Rejected'}`,
          message: `
            <h2>Product Approval Status Update</h2>
            <p>Your product <b>${product.name}</b> has been <b>${status}</b> by the admin.</p>
            ${status === 'rejected' ? `<p>Reason: ${product.approvalRejectionReason}</p>` : ''}
          `
        });
      }

      await Notification.create({
        user: seller._id,
        type: `PRODUCT_${status.toUpperCase()}`,
        message: `Your product "${product.name}" has been ${status}.${status === 'rejected' ? ' Reason: ' + product.approvalRejectionReason : ''}`,
        relatedEntity: product._id,
        entityModel: 'Product'
      });
    } catch (notifErr) {
      console.error('Failed to notify seller about product approval:', notifErr.message);
    }

    res.json({
      success: true,
      message: `Product ${status} successfully`,
      product
    });
  } catch (error) {
    console.error('❌ Approve product error:', error);
    res.status(500).json({ success: false, message: 'Error updating product status' });
  }
});

module.exports = {
  getProducts,
  filterProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  getSellerProducts,
  bulkUploadProducts,
  getProductAnalytics,
  getRecipeSuggestion,
  getPendingProducts,
  approveProduct,
};