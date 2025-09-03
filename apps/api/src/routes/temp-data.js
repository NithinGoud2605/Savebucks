import { Router } from 'express';

const router = Router();

// Temporary static data endpoints to bypass database issues
router.get('/temp-deals', (req, res) => {
  const mockDeals = [
    {
      id: 1,
      title: "Samsung Galaxy S24 Ultra - $200 Off",
      url: "https://example.com/deal/1",
      price: 999,
      original_price: 1199,
      merchant: "Samsung",
      description: "Latest Samsung flagship with S Pen and amazing camera",
      image_url: "https://images.samsung.com/is/image/samsung/p6pim/us/galaxy-s24-ultra/gallery/us-galaxy-s24-ultra-s928-sm-s928uzkaxaa-thumb-539573421",
      discount_percentage: 17,
      created_at: "2025-01-01T00:00:00Z",
      is_featured: true,
      views_count: 250,
      clicks_count: 45,
      categories: { name: "Electronics", slug: "electronics" },
      companies: { name: "Samsung", slug: "samsung", logo_url: "https://logo.clearbit.com/samsung.com" },
      votes: { ups: 25, downs: 2, score: 23 }
    },
    {
      id: 2,
      title: "Nike Air Max 270 - 30% Off",
      url: "https://example.com/deal/2",
      price: 105,
      original_price: 150,
      merchant: "Nike",
      description: "Comfortable running shoes with Air Max technology",
      image_url: "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/awjogtdnqxniqqk0wpgf/air-max-270-mens-shoes-KkLcGR.png",
      discount_percentage: 30,
      created_at: "2025-01-01T00:00:00Z",
      is_featured: false,
      views_count: 180,
      clicks_count: 32,
      categories: { name: "Fashion", slug: "fashion" },
      companies: { name: "Nike", slug: "nike", logo_url: "https://logo.clearbit.com/nike.com" },
      votes: { ups: 18, downs: 1, score: 17 }
    },
    {
      id: 3,
      title: "Apple MacBook Air M3 - $150 Off",
      url: "https://example.com/deal/3",
      price: 949,
      original_price: 1099,
      merchant: "Apple",
      description: "Latest MacBook Air with M3 chip, perfect for work and creativity",
      image_url: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba13-midnight-select-202402",
      discount_percentage: 14,
      created_at: "2025-01-01T00:00:00Z",
      is_featured: true,
      views_count: 320,
      clicks_count: 58,
      categories: { name: "Electronics", slug: "electronics" },
      companies: { name: "Apple", slug: "apple", logo_url: "https://logo.clearbit.com/apple.com" },
      votes: { ups: 35, downs: 3, score: 32 }
    },
    {
      id: 4,
      title: "Sony WH-1000XM5 Headphones - 25% Off",
      url: "https://example.com/deal/4",
      price: 299,
      original_price: 399,
      merchant: "Sony",
      description: "Industry-leading noise canceling headphones",
      image_url: "https://sony.scene7.com/is/image/sonyglobalsolutions/wh-1000xm5_Primary_image",
      discount_percentage: 25,
      created_at: "2025-01-01T00:00:00Z",
      is_featured: false,
      views_count: 195,
      clicks_count: 41,
      categories: { name: "Electronics", slug: "electronics" },
      companies: { name: "Sony", slug: "sony", logo_url: "https://logo.clearbit.com/sony.com" },
      votes: { ups: 22, downs: 2, score: 20 }
    },
    {
      id: 5,
      title: "Microsoft Surface Pro 9 - $300 Off",
      url: "https://example.com/deal/5",
      price: 899,
      original_price: 1199,
      merchant: "Microsoft",
      description: "Versatile 2-in-1 laptop with touch screen",
      image_url: "https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RW15tI",
      discount_percentage: 25,
      created_at: "2025-01-01T00:00:00Z",
      is_featured: true,
      views_count: 210,
      clicks_count: 38,
      categories: { name: "Electronics", slug: "electronics" },
      companies: { name: "Microsoft", slug: "microsoft", logo_url: "https://logo.clearbit.com/microsoft.com" },
      votes: { ups: 28, downs: 2, score: 26 }
    },
    {
      id: 6,
      title: "Adidas Ultraboost 22 - 40% Off",
      url: "https://example.com/deal/6",
      price: 108,
      original_price: 180,
      merchant: "Adidas",
      description: "Premium running shoes with Boost technology",
      image_url: "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/fbaf991a78bc4896a3e9ad7800abcec6_9366/Ultraboost_22_Shoes_Black_GZ0127_01_standard.jpg",
      discount_percentage: 40,
      created_at: "2025-01-01T00:00:00Z",
      is_featured: false,
      views_count: 165,
      clicks_count: 29,
      categories: { name: "Fashion", slug: "fashion" },
      companies: { name: "Adidas", slug: "adidas", logo_url: "https://logo.clearbit.com/adidas.com" },
      votes: { ups: 19, downs: 1, score: 18 }
    },
    {
      id: 7,
      title: "Amazon Echo Dot (5th Gen) - 50% Off",
      url: "https://example.com/deal/7",
      price: 25,
      original_price: 50,
      merchant: "Amazon",
      description: "Smart speaker with Alexa voice control",
      image_url: "https://m.media-amazon.com/images/I/714Rq4k05UL._AC_SL1000_.jpg",
      discount_percentage: 50,
      created_at: "2025-01-01T00:00:00Z",
      is_featured: true,
      views_count: 340,
      clicks_count: 67,
      categories: { name: "Electronics", slug: "electronics" },
      companies: { name: "Amazon", slug: "amazon", logo_url: "https://logo.clearbit.com/amazon.com" },
      votes: { ups: 42, downs: 3, score: 39 }
    },
    {
      id: 8,
      title: "Instant Pot Duo 7-in-1 - 35% Off",
      url: "https://example.com/deal/8",
      price: 65,
      original_price: 100,
      merchant: "Instant Pot",
      description: "Multi-functional pressure cooker for quick meals",
      image_url: "https://m.media-amazon.com/images/I/71VBX8UBDEL._AC_SL1500_.jpg",
      discount_percentage: 35,
      created_at: "2025-01-01T00:00:00Z",
      is_featured: false,
      views_count: 125,
      clicks_count: 22,
      categories: { name: "Home & Garden", slug: "home-garden" },
      companies: { name: "Instant Pot", slug: "instant-pot", logo_url: "https://logo.clearbit.com/instantpot.com" },
      votes: { ups: 15, downs: 1, score: 14 }
    }
  ];

  const limit = req.query.limit ? parseInt(req.query.limit) : mockDeals.length;
  res.json(mockDeals.slice(0, limit));
});

router.get('/temp-coupons', (req, res) => {
  const mockCoupons = [
    {
      id: 1,
      title: "20% Off Amazon Electronics",
      description: "Save 20% on all electronics at Amazon",
      coupon_code: "SAVE20",
      coupon_type: "percentage",
      discount_value: 20,
      minimum_order_amount: 50,
      expires_at: "2025-12-31T23:59:59Z",
      created_at: "2025-01-01T00:00:00Z",
      is_featured: true,
      views_count: 150,
      clicks_count: 45,
      success_rate: 85,
      companies: {
        id: 1,
        name: 'Amazon',
        slug: 'amazon',
        logo_url: 'https://logo.clearbit.com/amazon.com',
        is_verified: true
      },
      categories: {
        id: 1,
        name: 'Electronics',
        slug: 'electronics',
        color: '#3B82F6'
      },
      votes: { ups: 25, downs: 2, score: 23 }
    },
    {
      id: 2,
      title: "$10 Off Nike Orders",
      description: "Get $10 off your Nike purchase",
      coupon_code: "NIKE10",
      coupon_type: "fixed_amount",
      discount_value: 10,
      minimum_order_amount: 75,
      expires_at: "2025-12-31T23:59:59Z",
      created_at: "2025-01-01T00:00:00Z",
      is_featured: false,
      views_count: 120,
      clicks_count: 38,
      success_rate: 78,
      companies: {
        id: 2,
        name: 'Nike',
        slug: 'nike',
        logo_url: 'https://logo.clearbit.com/nike.com',
        is_verified: true
      },
      categories: {
        id: 2,
        name: 'Fashion',
        slug: 'fashion',
        color: '#F59E0B'
      },
      votes: { ups: 18, downs: 1, score: 17 }
    }
  ];

  const limit = req.query.limit ? parseInt(req.query.limit) : mockCoupons.length;
  res.json(mockCoupons.slice(0, limit));
});

export default router;
