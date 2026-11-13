import Product from '../models/Product.js';

// @desc Get all products with rich filtering, searching and sorting
// @route GET /api/products
export const getProducts = async (req, res) => {
  try {
    const {
      keyword,
      category,
      brand,
      minPrice,
      maxPrice,
      inStock,
      tag,
      sort,
      page = 1,
      limit = 60
    } = req.query;

    let query = {};
    const andConditions = [];

    // Search keyword (multi-word friendly: every token matches across name, brand, category, or tags)
    if (keyword) {
      const tokens = keyword
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

      for (const token of tokens) {
        const tokenRegex = new RegExp(token, 'i');
        andConditions.push({
          $or: [
            { name: tokenRegex },
            { brand: tokenRegex },
            { category: tokenRegex },
            { tags: { $in: [tokenRegex] } }
          ]
        });
      }
    }

    // Category filter
    if (category && category !== 'All') {
      andConditions.push({
        $or: [
          { category: category },
          { categorySlug: category.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
        ]
      });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    // Brand filter
    if (brand && brand !== 'All') {
      const brands = brand.split(',');
      query.brand = { $in: brands };
    }

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Stock availability
    if (inStock === 'true') {
      query.inStock = true;
    }

    // Special collections / tags
    if (tag) {
      if (tag === 'trending') query.isTrending = true;
      if (tag === 'bestseller') query.isBestSeller = true;
      if (tag === 'essential') query.isDailyEssential = true;
      if (tag === 'deal') query.isDeal = true;
    }

    // Sorting
    let sortQuery = { createdAt: -1 };
    if (sort === 'price-low') sortQuery = { price: 1 };
    else if (sort === 'price-high') sortQuery = { price: -1 };
    else if (sort === 'rating') sortQuery = { rating: -1 };
    else if (sort === 'discount') sortQuery = { discountPercent: -1 };
    else if (sort === 'popularity') sortQuery = { numReviews: -1 };

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalProducts = await Product.countDocuments(query);
    let products;

    // When searching by keyword with default/popularity sort, prioritize direct name/brand matches over category-only hits
    if (keyword && (!sort || sort === 'popularity')) {
      const kwLower = keyword.trim().toLowerCase();
      const kwTokens = kwLower.split(/\s+/).filter(Boolean);
      const allMatches = await Product.find(query).lean();
      allMatches.sort((a, b) => {
        const score = (p) => {
          const name = (p.name || '').toLowerCase();
          const brand = (p.brand || '').toLowerCase();
          const tags = (p.tags || []).join(' ').toLowerCase();
          let s = 0;
          if (name.includes(kwLower)) s += 100;
          if (brand.includes(kwLower)) s += 40;
          for (const t of kwTokens) {
            if (name.includes(t)) s += 30;
            if (brand.includes(t)) s += 15;
            if (tags.includes(t)) s += 10;
          }
          return s;
        };
        const diff = score(b) - score(a);
        if (diff !== 0) return diff;
        return (b.numReviews || 0) - (a.numReviews || 0);
      });
      products = allMatches.slice(skip, skip + limitNum);
    } else {
      products = await Product.find(query)
        .sort(sortQuery)
        .limit(limitNum)
        .skip(skip);
    }

    // Get available brands for filters
    const availableBrands = await Product.distinct('brand', category && category !== 'All' ? { category } : {});

    res.json({
      products,
      page: pageNum,
      pages: Math.ceil(totalProducts / limitNum) || 1,
      total: totalProducts,
      brands: availableBrands
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get homepage featured products sections
// @route GET /api/products/featured
export const getFeaturedProducts = async (req, res) => {
  try {
    const [trending, bestSellers, dailyEssentials, deals, newArrivals] = await Promise.all([
      Product.find({ isTrending: true }).limit(8),
      Product.find({ isBestSeller: true }).limit(8),
      Product.find({ isDailyEssential: true }).limit(8),
      Product.find({ isDeal: true }).limit(8),
      Product.find().sort({ createdAt: -1 }).limit(8)
    ]);

    res.json({
      trending,
      bestSellers,
      dailyEssentials,
      deals,
      newArrivals
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get product by ID
// @route GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Also fetch related products in same category
    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id }
    }).limit(6);

    res.json({ product, related });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create a new product (Admin)
// @route POST /api/products
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      brand,
      category,
      unit,
      price,
      originalPrice,
      image,
      images,
      description,
      stockCount,
      isTrending,
      isBestSeller,
      isDailyEssential,
      isDeal
    } = req.body;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    const categorySlug = category ? category.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'general';

    const product = new Product({
      name,
      slug,
      brand: brand || 'QuickBasket Fresh',
      category: category || 'Household Essentials',
      categorySlug,
      unit: unit || '1 unit',
      price: Number(price),
      originalPrice: Number(originalPrice || price),
      image: image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500',
      images: images || [],
      description: description || 'Fresh premium quality product delivered in 10 minutes.',
      stockCount: stockCount !== undefined ? Number(stockCount) : 50,
      inStock: stockCount > 0,
      isTrending: !!isTrending,
      isBestSeller: !!isBestSeller,
      isDailyEssential: !!isDailyEssential,
      isDeal: !!isDeal
    });

    const created = await product.save();
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update product (Admin)
// @route PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    Object.assign(product, req.body);
    if (req.body.stockCount !== undefined) {
      product.inStock = Number(req.body.stockCount) > 0;
    }

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete product (Admin)
// @route DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.deleteOne({ _id: product._id });
    res.json({ message: 'Product removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Add product review
// @route POST /api/products/:id/reviews
export const addProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: 'Product not found' });

    const review = {
      name: req.user ? req.user.name : 'Verified Customer',
      rating: Number(rating),
      comment,
      user: req.user ? req.user._id : null
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Review added successfully', product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
