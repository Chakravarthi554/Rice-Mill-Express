// =============================================================================
// Rice Mill Express — Mock Data Layer (Slice 1)
// -----------------------------------------------------------------------------
// DEMO / FALLBACK CONTENT ONLY.
//
// IMPORTANT: This data MUST NOT replace live API data anywhere. It exists so
// the new design-system components can be previewed and so future screens can
// show realistic placeholder content while live data loads or in empty/demo
// states. Always prefer real Redux/API data; fall back to these only when
// explicitly intended.
// =============================================================================

// Royalty-free placeholder imagery (Unsplash source URLs).
const img = {
  basmati: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
  sona: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=600&q=80',
  brown: 'https://images.unsplash.com/photo-1626078299034-94d1f0a3a0a3?w=600&q=80',
  kolam: 'https://images.unsplash.com/photo-1594270881479-3c8fd0a0bf6b?w=600&q=80',
  ponni: 'https://images.unsplash.com/photo-1601000938259-9e92002320b2?w=600&q=80',
  steam: 'https://images.unsplash.com/photo-1568347355280-d33a3f3b8b86?w=600&q=80',
  wholesale: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80',
  heroFarm: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80',
  heroGrains: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=1200&q=80',
};

// ---------------------------------------------------------------------------
// CATEGORIES
// ---------------------------------------------------------------------------
export const mockCategories = [
  { id: 'basmati', name: 'Basmati Rice', emoji: '🍚', tint: '#FFF7ED', color: '#EA580C' },
  { id: 'sona', name: 'Sona Masoori', emoji: '🌾', tint: '#F0FDF4', color: '#16A34A' },
  { id: 'kolam', name: 'Kolam Rice', emoji: '🥣', tint: '#EFF6FF', color: '#2563EB' },
  { id: 'brown', name: 'Brown Rice', emoji: '🌿', tint: '#F5F3FF', color: '#7C3AED' },
  { id: 'organic', name: 'Organic Rice', emoji: '🍃', tint: '#F0FDF4', color: '#16A34A' },
  { id: 'ponni', name: 'Ponni Rice', emoji: '🍛', tint: '#FEFCE8', color: '#CA8A04' },
  { id: 'steam', name: 'Steam Rice', emoji: '♨️', tint: '#EFF6FF', color: '#0EA5E9' },
  { id: 'wholesale', name: 'Wholesale', emoji: '📦', tint: '#FEFCE8', color: '#CA8A04' },
];

// ---------------------------------------------------------------------------
// PRODUCTS (premium rice catalog)
// ---------------------------------------------------------------------------
export const mockProducts = [
  {
    _id: 'mock-p1', name: 'Premium Basmati Rice', brand: 'Royal Harvest', category: 'basmati',
    image: img.basmati, price: 1499, mrp: 1899, weight: '10 kg', unit: 'bag',
    rating: 4.7, numReviews: 1284, countInStock: 42, discount: 21,
    deliveryEta: 'Tomorrow', seller: 'Royal Harvest Mills', sellerVerified: true,
    organic: false, bestSeller: true, tags: ['Aged 2 Years', 'Long Grain'],
  },
  {
    _id: 'mock-p2', name: 'Sona Masoori Gold', brand: 'GoldenField', category: 'sona',
    image: img.sona, price: 899, mrp: 1099, weight: '10 kg', unit: 'bag',
    rating: 4.5, numReviews: 932, countInStock: 60, discount: 18,
    deliveryEta: 'Tomorrow', seller: 'GoldenField Agro', sellerVerified: true,
    organic: false, bestSeller: true, tags: ['Soft Texture', 'Daily Use'],
  },
  {
    _id: 'mock-p3', name: 'Brown Organic Rice', brand: 'PureEarth', category: 'brown',
    image: img.brown, price: 1249, mrp: 1499, weight: '5 kg', unit: 'bag',
    rating: 4.6, numReviews: 540, countInStock: 28, discount: 17,
    deliveryEta: '2 days', seller: 'PureEarth Organics', sellerVerified: true,
    organic: true, bestSeller: false, tags: ['High Fiber', 'Certified Organic'],
  },
  {
    _id: 'mock-p4', name: 'Kolam Rice', brand: 'FarmFresh', category: 'kolam',
    image: img.kolam, price: 749, mrp: 849, weight: '10 kg', unit: 'bag',
    rating: 4.3, numReviews: 410, countInStock: 15, discount: 12,
    deliveryEta: 'Tomorrow', seller: 'FarmFresh Mills', sellerVerified: false,
    organic: false, bestSeller: false, tags: ['Light & Fluffy'],
  },
  {
    _id: 'mock-p5', name: 'Ponni Rice', brand: 'SouthGrain', category: 'ponni',
    image: img.ponni, price: 829, mrp: 949, weight: '10 kg', unit: 'bag',
    rating: 4.4, numReviews: 367, countInStock: 33, discount: 13,
    deliveryEta: '2 days', seller: 'SouthGrain Traders', sellerVerified: true,
    organic: false, bestSeller: false, tags: ['Boiled', 'South Indian'],
  },
  {
    _id: 'mock-p6', name: 'Steam Rice', brand: 'DailyStaple', category: 'steam',
    image: img.steam, price: 699, mrp: 799, weight: '10 kg', unit: 'bag',
    rating: 4.2, numReviews: 288, countInStock: 0, discount: 12,
    deliveryEta: 'Out of stock', seller: 'DailyStaple Foods', sellerVerified: false,
    organic: false, bestSeller: false, tags: ['Everyday'],
  },
  {
    _id: 'mock-p7', name: 'Wholesale Rice Bag (25kg)', brand: 'BulkBazaar', category: 'wholesale',
    image: img.wholesale, price: 2199, mrp: 2599, weight: '25 kg', unit: 'sack',
    rating: 4.8, numReviews: 156, countInStock: 80, discount: 15,
    deliveryEta: '3 days', seller: 'BulkBazaar Wholesale', sellerVerified: true,
    organic: false, bestSeller: true, tags: ['Bulk', 'Best Value'],
  },
];

// Curated slices
export const mockBestSellers = mockProducts.filter((p) => p.bestSeller);
export const mockOrganic = mockProducts.filter((p) => p.organic);
export const mockWholesale = mockProducts.filter((p) => p.category === 'wholesale');
export const mockFeatured = mockProducts.slice(0, 4);

// ---------------------------------------------------------------------------
// HERO BANNERS
// ---------------------------------------------------------------------------
export const mockHeroBanners = [
  {
    id: 'b1', badge: 'Festival Special', title: '20% OFF on Bulk Basmati',
    subtitle: 'Premium aged grains, milled fresh for the season.', cta: 'Shop Now',
    href: '/products', image: img.heroGrains,
    gradient: 'linear-gradient(135deg, #FF8F00 0%, #FFB300 100%)',
  },
  {
    id: 'b2', badge: 'New Harvest', title: 'Fresh Sona Masoori Arrived',
    subtitle: 'Straight from the farm to your kitchen.', cta: 'Explore',
    href: '/products', image: img.heroFarm,
    gradient: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
  },
  {
    id: 'b3', badge: 'Free Delivery', title: 'On Orders Above ₹500',
    subtitle: 'No hidden fees. Fast, trusted doorstep delivery.', cta: 'Order Now',
    href: '/products', image: img.heroGrains,
    gradient: 'linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)',
  },
];

// ---------------------------------------------------------------------------
// PROMOTIONS / OFFERS
// ---------------------------------------------------------------------------
export const mockPromotions = [
  { id: 'promo1', title: 'Flash Sale', subtitle: 'Up to 25% off', code: 'FLASH25', tint: '#FEF2F2', color: '#DC2626' },
  { id: 'promo2', title: 'First Order', subtitle: 'Flat ₹100 off', code: 'WELCOME100', tint: '#F0FDF4', color: '#16A34A' },
  { id: 'promo3', title: 'Wallet Cashback', subtitle: '5% back on prepaid', code: 'WALLET5', tint: '#FFFBEB', color: '#F59E0B' },
];

export const mockSeasonalOffers = [
  { id: 'season1', title: 'Harvest Festival Collection', subtitle: 'Limited-time premium picks', image: img.heroFarm },
  { id: 'season2', title: 'Monsoon Stock-Up Deals', subtitle: 'Save more on wholesale sacks', image: img.wholesale },
];

// ---------------------------------------------------------------------------
// REVIEWS
// ---------------------------------------------------------------------------
export const mockReviews = [
  { id: 'r1', name: 'Anita Sharma', avatar: null, rating: 5, date: '2 days ago', verified: true,
    title: 'Excellent aroma', comment: 'The basmati cooked perfectly — long grains and great fragrance. Will reorder.' },
  { id: 'r2', name: 'Rahul Verma', avatar: null, rating: 4, date: '1 week ago', verified: true,
    title: 'Good value', comment: 'Decent quality for the price. Packaging was secure and delivery was on time.' },
  { id: 'r3', name: 'Meena Iyer', avatar: null, rating: 5, date: '3 weeks ago', verified: false,
    title: 'Family favourite', comment: 'Soft and fluffy every time. The organic brown rice is now a staple at home.' },
];

// ---------------------------------------------------------------------------
// DELIVERY ETA OPTIONS
// ---------------------------------------------------------------------------
export const mockDeliveryEtas = ['Today', 'Tomorrow', '2 days', '3 days'];

const mockData = {
  mockCategories,
  mockProducts,
  mockBestSellers,
  mockOrganic,
  mockWholesale,
  mockFeatured,
  mockHeroBanners,
  mockPromotions,
  mockSeasonalOffers,
  mockReviews,
  mockDeliveryEtas,
};

export default mockData;
