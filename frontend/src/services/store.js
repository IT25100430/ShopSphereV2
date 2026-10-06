// Shop Sphere In-Memory & LocalStorage Data Store
// Robust multi-vendor catalog, cart, orders, reviews, promotions, and administration

const STORAGE_KEYS = {
  USERS: 'shopsphere_users',
  CATEGORIES: 'shopsphere_categories',
  BRANDS: 'shopsphere_brands',
  PRODUCTS: 'shopsphere_products',
  PROMOTIONS: 'shopsphere_promotions',
  ORDERS: 'shopsphere_orders',
  REVIEWS: 'shopsphere_reviews',
  CART: 'shopSphereCart',
  LOGGED_IN_USER: 'shopSphereUser',
};

const DEFAULT_USERS = [
  {
    user_id: 'usr-admin-01',
    name: 'Admin Manager',
    email: 'admin@shopsphere.lk',
    phone: '+94 77 123 4567',
    role: 'ADMINISTRATOR',
  },
  {
    user_id: 'usr-cust-01',
    name: 'Kasun Jayasinghe',
    email: 'kasun@gmail.com',
    phone: '+94 77 890 1234',
    role: 'CUSTOMER',
    shipping_address: 'No 45, Galle Road, Colombo 03',
    loyalty_points: 150,
  },
  {
    user_id: 'usr-deliv-01',
    name: 'Sunil Rathnayake (Courier)',
    email: 'delivery@shopsphere.lk',
    phone: '+94 71 901 2345',
    role: 'DELIVERY_STAFF',
    vehicle_no: 'WP-CA-8842',
    availability_status: 'AVAILABLE',
  },
];

const DEFAULT_CATEGORIES = [
  {
    category_id: 'cat-1',
    category_name: 'Electronics',
    description: 'High-tech smart gadgets, audio accessories, and computing devices.',
    icon: '📱',
    is_active: true,
  },
  {
    category_id: 'cat-2',
    category_name: 'Fashion & Apparel',
    description: 'Trendy clothing, premium footwear, and stylish lifestyle accessories.',
    icon: '👕',
    is_active: true,
  },
  {
    category_id: 'cat-3',
    category_name: 'Home & Living',
    description: 'Modern furniture, ambient lighting, and essential kitchen appliances.',
    icon: '🏠',
    is_active: true,
  },
  {
    category_id: 'cat-4',
    category_name: 'Beauty & Personal Care',
    description: 'Organic skincare sets, haircare products, and wellness essentials.',
    icon: '💄',
    is_active: true,
  },
  {
    category_id: 'cat-5',
    category_name: 'Sports & Fitness',
    description: 'Workout gear, sporting equipment, and athleisure essentials.',
    icon: '⚽',
    is_active: true,
  },
];

const DEFAULT_BRANDS = [
  {
    brand_id: 'brd-1',
    brand_name: 'Apple',
    description: 'Premium electronics, computers, and smart wearables.',
    origin: 'United States',
    is_active: true,
  },
  {
    brand_id: 'brd-2',
    brand_name: 'Sony',
    description: 'World-renowned high-resolution audio and visual technology.',
    origin: 'Japan',
    is_active: true,
  },
  {
    brand_id: 'brd-3',
    brand_name: 'Nike',
    description: 'Leading global athletic footwear and sportswear.',
    origin: 'United States',
    is_active: true,
  },
  {
    brand_id: 'brd-4',
    brand_name: 'IKEA',
    description: 'Modern functional home furniture and minimalist living decor.',
    origin: 'Sweden',
    is_active: true,
  },
  {
    brand_id: 'brd-5',
    brand_name: 'Samsung',
    description: 'Cutting-edge smartphones, displays, and consumer electronics.',
    origin: 'South Korea',
    is_active: true,
  },
  {
    brand_id: 'brd-6',
    brand_name: 'Philips',
    description: 'Innovative home lighting, health appliances, and personal care products.',
    origin: 'Netherlands',
    is_active: true,
  },
];

const DEFAULT_PRODUCTS = [
  {
    product_id: 'prod-1',
    product_name: 'Wireless Noise-Cancelling Headphones',
    category_id: 'cat-1',
    brand_id: 'brd-2',
    price: 12999,
    stock_qty: 18,
    low_stock_threshold: 5,
    status: 'ACTIVE',
    is_active: true,
    is_deleted: false,
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    description: 'Premium noise-cancelling over-ear headphones with 30-hour battery life, high-resolution audio drivers, and comfortable plush ear cushions.',
    rating: 4.8,
  },
  {
    product_id: 'prod-2',
    product_name: 'Smart Watch Series 9 GPS',
    category_id: 'cat-1',
    brand_id: 'brd-1',
    price: 15999,
    stock_qty: 12,
    low_stock_threshold: 4,
    status: 'ACTIVE',
    is_active: true,
    is_deleted: false,
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    description: 'Advanced smartwatch featuring heart-rate monitoring, ECG sensor, GPS tracking, and always-on retina display with water resistance up to 50m.',
    rating: 4.7,
  },
  {
    product_id: 'prod-3',
    product_name: 'Classic Urban Cotton T-Shirt',
    category_id: 'cat-2',
    brand_id: 'brd-3',
    price: 2999,
    stock_qty: 35,
    low_stock_threshold: 10,
    status: 'ACTIVE',
    is_active: true,
    is_deleted: false,
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
    description: 'Soft 100% breathable combed organic cotton crewneck t-shirt. Ideal for casual everyday wear with reinforced double-stitched seams.',
    rating: 4.3,
  },
  {
    product_id: 'prod-4',
    product_name: 'Air Flow Running Shoes',
    category_id: 'cat-2',
    brand_id: 'brd-3',
    price: 8999,
    stock_qty: 8,
    low_stock_threshold: 5,
    status: 'ACTIVE',
    is_active: true,
    is_deleted: false,
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    description: 'Ultra-lightweight running sneakers engineered with responsive air cushioning, ergonomic arch support, and high-traction rubber outsole.',
    rating: 4.6,
  },
  {
    product_id: 'prod-5',
    product_name: 'Smart Drip Coffee Maker',
    category_id: 'cat-3',
    brand_id: 'brd-6',
    price: 11999,
    stock_qty: 3,
    low_stock_threshold: 5,
    status: 'ACTIVE',
    is_active: true,
    is_deleted: false,
    image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    description: 'Programmable 12-cup drip coffee maker featuring auto-brew timer, permanent mesh filter, and warming plate for the perfect morning brew.',
    rating: 4.4,
  },
  {
    product_id: 'prod-6',
    product_name: 'Organic Hydrating Skincare Set',
    category_id: 'cat-4',
    brand_id: 'brd-4',
    price: 4999,
    stock_qty: 22,
    low_stock_threshold: 6,
    status: 'ACTIVE',
    is_active: true,
    is_deleted: false,
    image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=800&q=80',
    description: 'Complete 3-step botanical facial care kit with hydrating cleanser, revitalizing toner, and hyaluronic acid night serum.',
    rating: 4.8,
  },
  {
    product_id: 'prod-7',
    product_name: 'Galaxy Pro 5G Smartphone',
    category_id: 'cat-1',
    brand_id: 'brd-5',
    price: 89999,
    stock_qty: 6,
    low_stock_threshold: 3,
    status: 'ACTIVE',
    is_active: true,
    is_deleted: false,
    image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    description: 'Flagship 6.7-inch AMOLED 120Hz display smartphone, triple 108MP camera array, 5000mAh battery, and superfast wireless charging.',
    rating: 4.9,
  },
  {
    product_id: 'prod-8',
    product_name: 'Ultra-Thin Work & Gaming Laptop',
    category_id: 'cat-1',
    brand_id: 'brd-1',
    price: 189999,
    stock_qty: 4,
    low_stock_threshold: 3,
    status: 'ACTIVE',
    is_active: true,
    is_deleted: false,
    image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
    description: 'Sleek aluminum chassis laptop powered by high-performance 10-core CPU, 16GB unified RAM, and 512GB NVMe SSD with 18-hour battery endurance.',
    rating: 4.7,
  },
  {
    product_id: 'prod-9',
    product_name: 'Designer Leather Handbag',
    category_id: 'cat-2',
    brand_id: 'brd-3',
    price: 6999,
    stock_qty: 15,
    low_stock_threshold: 5,
    status: 'ACTIVE',
    is_active: true,
    is_deleted: false,
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    description: 'Handcrafted genuine leather tote bag with gold-plated metallic hardware, spacious zipped interior compartment, and detachable shoulder strap.',
    rating: 4.5,
  },
  {
    product_id: 'prod-10',
    product_name: 'Minimalist Nordic Table Lamp',
    category_id: 'cat-3',
    brand_id: 'brd-4',
    price: 5499,
    stock_qty: 0,
    low_stock_threshold: 5,
    status: 'OUT_OF_STOCK',
    is_active: true,
    is_deleted: false,
    image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
    description: 'Dimmable warm-LED architectural desk lamp with touch controls, matte finish, and integrated USB-C charging output.',
    rating: 4.2,
  },
];

const DEFAULT_PROMOTIONS = [
  {
    promotion_id: 'promo-1',
    promotion_code: 'SAVE10',
    title: '10% Welcome Discount',
    description: 'Get 10% off your entire order with no minimum spend!',
    discount_type: 'PERCENTAGE',
    discount_value: 10,
    min_spend: 0,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    status: 'ACTIVE',
  },
  {
    promotion_id: 'promo-2',
    promotion_code: 'FLAT500',
    title: 'Flat Rs. 500 Off',
    description: 'Enjoy a flat Rs. 500 discount on orders over Rs. 5,000.',
    discount_type: 'FIXED_AMOUNT',
    discount_value: 500,
    min_spend: 5000,
    start_date: '2026-02-01',
    end_date: '2026-12-31',
    status: 'ACTIVE',
  },
  {
    promotion_id: 'promo-3',
    promotion_code: 'MALL2026',
    title: 'Grand Mall Celebration',
    description: 'Special 15% discount on orders above Rs. 10,000.',
    discount_type: 'PERCENTAGE',
    discount_value: 15,
    min_spend: 10000,
    start_date: '2026-03-01',
    end_date: '2026-12-31',
    status: 'ACTIVE',
  },
];

const DEFAULT_ORDERS = [
  {
    order_id: 'ORD-902101',
    customer_id: 'usr-cust-01',
    customer_name: 'Kasun Jayasinghe',
    customer_email: 'kasun@gmail.com',
    customer_phone: '0778901234',
    shipping_address: 'No 45, Galle Road, Colombo 03',
    city: 'Colombo',
    postal_code: '00300',
    order_date: '2026-09-14T14:32:00.000Z',
    status: 'SHIPPED',
    payment_method: 'Credit / Debit Card',
    payment_status: 'COMPLETED',
    subtotal: 15999,
    discount: 1599.9,
    promo_code: 'SAVE10',
    delivery_fee: 350,
    total_amount: 14749.1,
    staff_name: 'Sunil Rathnayake (Courier)',
    vehicle_no: 'WP-CA-8842',
    order_items: [
      {
        product_id: 'prod-2',
        product_name: 'Smart Watch Series 9 GPS',
        price: 15999,
        quantity: 1,
        image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    order_id: 'ORD-902102',
    customer_id: 'usr-cust-01',
    customer_name: 'Kasun Jayasinghe',
    customer_email: 'kasun@gmail.com',
    customer_phone: '0778901234',
    shipping_address: 'No 12, Kandy Road, Kiribathgoda',
    city: 'Gampaha',
    postal_code: '11600',
    order_date: '2026-09-15T08:15:00.000Z',
    status: 'PROCESSING',
    payment_method: 'Cash on Delivery',
    payment_status: 'PENDING',
    subtotal: 11998,
    discount: 500,
    promo_code: 'FLAT500',
    delivery_fee: 350,
    total_amount: 11848,
    staff_name: 'Sunil Rathnayake (Courier)',
    vehicle_no: 'WP-CA-8842',
    order_items: [
      {
        product_id: 'prod-3',
        product_name: 'Classic Urban Cotton T-Shirt',
        price: 2999,
        quantity: 1,
        image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
      },
      {
        product_id: 'prod-4',
        product_name: 'Air Flow Running Shoes',
        price: 8999,
        quantity: 1,
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
];

const formatStars = (rating) => {
  const stars = Math.round(Number(rating) || 5);
  if (stars >= 5) return '★★★★★';
  if (stars === 4) return '★★★★☆';
  if (stars === 3) return '★★★☆☆';
  if (stars === 2) return '★★☆☆☆';
  return '★☆☆☆☆';
};

const DEFAULT_REVIEWS = [
  {
    review_id: 'rev-1',
    product_id: 'prod-1',
    customer_name: 'Nadeesha K.',
    rating: 5,
    rating_stars: '★★★★★',
    comment: 'Exceptional noise cancellation! Bass is deep, crisp sound, and battery lasts multiple days.',
    status: 'APPROVED',
    review_date: '2026-09-10T10:20:00.000Z',
  },
  {
    review_id: 'rev-2',
    product_id: 'prod-1',
    customer_name: 'Kavinda S.',
    rating: 5,
    rating_stars: '★★★★★',
    comment: 'Deep bass and very comfortable to wear for work calls.',
    status: 'APPROVED',
    review_date: '2026-09-12T14:20:00.000Z',
  },
  {
    review_id: 'rev-3',
    product_id: 'prod-2',
    customer_name: 'Chathura M.',
    rating: 5,
    rating_stars: '★★★★★',
    comment: 'Display is super bright outdoors. Heart rate and workout tracking are very accurate.',
    status: 'APPROVED',
    review_date: '2026-09-11T12:00:00.000Z',
  },
  {
    review_id: 'rev-4',
    product_id: 'prod-2',
    customer_name: 'Dilani W.',
    rating: 4,
    rating_stars: '★★★★☆',
    comment: 'Accurate step counting and heart sensor. Battery lasts 2 days.',
    status: 'APPROVED',
    review_date: '2026-09-13T16:45:00.000Z',
  },
  {
    review_id: 'rev-5',
    product_id: 'prod-3',
    customer_name: 'Nuwan F.',
    rating: 4,
    rating_stars: '★★★★☆',
    comment: 'Comfortable fabric and fits true to size.',
    status: 'APPROVED',
    review_date: '2026-09-11T08:15:00.000Z',
  },
  {
    review_id: 'rev-6',
    product_id: 'prod-3',
    customer_name: 'Sachini D.',
    rating: 5,
    rating_stars: '★★★★★',
    comment: 'Very durable cotton, retains shape after multiple washes.',
    status: 'APPROVED',
    review_date: '2026-09-14T11:30:00.000Z',
  },
  {
    review_id: 'rev-7',
    product_id: 'prod-4',
    customer_name: 'Mahesh P.',
    rating: 4,
    rating_stars: '★★★★☆',
    comment: 'Very comfortable running shoes, lightweight and great cushioning for daily jogs.',
    status: 'APPROVED',
    review_date: '2026-09-12T09:15:00.000Z',
  },
  {
    review_id: 'rev-8',
    product_id: 'prod-4',
    customer_name: 'Tharindu B.',
    rating: 5,
    rating_stars: '★★★★★',
    comment: 'Super light on feet and responsive cushioning on asphalt.',
    status: 'APPROVED',
    review_date: '2026-09-15T18:10:00.000Z',
  },
  {
    review_id: 'rev-9',
    product_id: 'prod-5',
    customer_name: 'Kamal S.',
    rating: 4,
    rating_stars: '★★★★☆',
    comment: 'Brews quickly and keeps coffee warm for hours. Looks elegant on my countertop.',
    status: 'APPROVED',
    review_date: '2026-09-15T07:45:00.000Z',
  },
  {
    review_id: 'rev-10',
    product_id: 'prod-5',
    customer_name: 'Anusha R.',
    rating: 5,
    rating_stars: '★★★★★',
    comment: 'Timer feature ensures hot coffee ready as soon as I wake up.',
    status: 'APPROVED',
    review_date: '2026-09-16T06:40:00.000Z',
  },
  {
    review_id: 'rev-11',
    product_id: 'prod-6',
    customer_name: 'Shehani M.',
    rating: 5,
    rating_stars: '★★★★★',
    comment: 'Natural glow within a week! Does not feel greasy at all.',
    status: 'APPROVED',
    review_date: '2026-09-13T10:20:00.000Z',
  },
  {
    review_id: 'rev-12',
    product_id: 'prod-6',
    customer_name: 'Prabash L.',
    rating: 5,
    rating_stars: '★★★★★',
    comment: 'High quality organic formulation, gentle on sensitive skin.',
    status: 'APPROVED',
    review_date: '2026-09-17T15:00:00.000Z',
  },
  {
    review_id: 'rev-13',
    product_id: 'prod-7',
    customer_name: 'Ashen G.',
    rating: 5,
    rating_stars: '★★★★★',
    comment: '120Hz display is stunning and camera zoom is unbeatable.',
    status: 'APPROVED',
    review_date: '2026-09-14T19:30:00.000Z',
  },
  {
    review_id: 'rev-14',
    product_id: 'prod-7',
    customer_name: 'Ruvini T.',
    rating: 5,
    rating_stars: '★★★★★',
    comment: 'Ultra-fast charging and top tier gaming performance.',
    status: 'APPROVED',
    review_date: '2026-09-18T13:45:00.000Z',
  },
  {
    review_id: 'rev-15',
    product_id: 'prod-8',
    customer_name: 'Dineth J.',
    rating: 5,
    rating_stars: '★★★★★',
    comment: 'Handles intensive programming and render jobs effortlessly.',
    status: 'APPROVED',
    review_date: '2026-09-15T12:00:00.000Z',
  },
  {
    review_id: 'rev-16',
    product_id: 'prod-8',
    customer_name: 'Hansani K.',
    rating: 4,
    rating_stars: '★★★★☆',
    comment: 'Crisp display, fast boot time, and silent cooling fans.',
    status: 'APPROVED',
    review_date: '2026-09-19T14:15:00.000Z',
  },
];

// LocalStorage Helper Functions
const get = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
};

const set = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('shopsphere_data_changed'));
  } catch (e) {
    console.error('Storage error:', e);
  }
};

export const initStore = () => {
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    set(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    set(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.BRANDS)) {
    set(STORAGE_KEYS.BRANDS, DEFAULT_BRANDS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROMOTIONS)) {
    set(STORAGE_KEYS.PROMOTIONS, DEFAULT_PROMOTIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    set(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
    set(STORAGE_KEYS.REVIEWS, DEFAULT_REVIEWS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    set(STORAGE_KEYS.USERS, DEFAULT_USERS);
  }

  // Attempt live sync with Java backend running on port 5000
  fetch('http://localhost:5000/api/health')
    .then((r) => r.json())
    .then((health) => {
      if (health && health.status === 'UP') {
        Promise.all([
          fetch('http://localhost:5000/api/products').then((r) => r.json()),
          fetch('http://localhost:5000/api/categories').then((r) => r.json()),
          fetch('http://localhost:5000/api/brands').then((r) => r.json()),
          fetch('http://localhost:5000/api/orders').then((r) => r.json()),
        ]).then(([prods, cats, brnds, ords]) => {
          if (prods && prods.length > 0) set(STORAGE_KEYS.PRODUCTS, prods);
          if (cats && cats.length > 0) set(STORAGE_KEYS.CATEGORIES, cats);
          if (brnds && brnds.length > 0) set(STORAGE_KEYS.BRANDS, brnds);
          if (ords && ords.length > 0) set(STORAGE_KEYS.ORDERS, ords);
        });
      }
    })
    .catch(() => {
      // Backend offline: localStorage handles everything seamlessly
    });
};

// ==========================================
// STORE API EXPORTS
// ==========================================
export const Store = {
  getUsers: () => get(STORAGE_KEYS.USERS, DEFAULT_USERS),

  // Products
  getProducts: (includeInactive = false) => {
    const list = get(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    return includeInactive ? list.filter((p) => !p.is_deleted) : list.filter((p) => p.is_active && !p.is_deleted);
  },
  getProductById: (id) => {
    const list = get(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    return list.find((p) => p.product_id === id || p.id === Number(id) || p.id === id);
  },
  addProduct: (productData) => {
    const list = get(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    const priceNum = Number(productData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      throw new Error('Product price cannot be a negative number.');
    }
    const newProduct = {
      product_id: 'prod-' + Date.now(),
      product_name: productData.product_name,
      category_id: productData.category_id,
      brand_id: productData.brand_id,
      price: priceNum || 0,
      stock_qty: Number(productData.stock_qty) || 0,
      low_stock_threshold: Number(productData.low_stock_threshold) || 5,
      status: Number(productData.stock_qty) > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
      is_active: true,
      is_deleted: false,
      image_url: productData.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      description: productData.description || '',
      rating: 5.0,
      created_at: new Date().toISOString(),
    };
    list.unshift(newProduct);
    set(STORAGE_KEYS.PRODUCTS, list);
    return newProduct;
  },
  updateProduct: (id, updates) => {
    if (updates.price !== undefined) {
      const priceNum = Number(updates.price);
      if (isNaN(priceNum) || priceNum < 0) {
        throw new Error('Product price cannot be a negative number.');
      }
    }
    const list = get(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    const updated = list.map((p) => {
      if (p.product_id === id || p.id === Number(id) || p.id === id) {
        const nextStock = updates.stock_qty !== undefined ? Number(updates.stock_qty) : p.stock_qty;
        return {
          ...p,
          ...updates,
          stock_qty: nextStock,
          status: nextStock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
        };
      }
      return p;
    });
    set(STORAGE_KEYS.PRODUCTS, updated);
  },
  deleteProduct: (id, soft = true) => {
    const list = get(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    let updated;
    if (soft) {
      updated = list.map((p) => (p.product_id === id ? { ...p, is_deleted: true } : p));
    } else {
      updated = list.filter((p) => p.product_id !== id);
    }
    set(STORAGE_KEYS.PRODUCTS, updated);
  },
  adjustStock: (id, change) => {
    const list = get(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    const updated = list.map((p) => {
      if (p.product_id === id || p.id === id) {
        const newQty = Math.max(0, (p.stock_qty || 0) + change);
        return {
          ...p,
          stock_qty: newQty,
          status: newQty > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
        };
      }
      return p;
    });
    set(STORAGE_KEYS.PRODUCTS, updated);
  },

  // Categories
  getCategories: () => get(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES),
  addCategory: (catData) => {
    const list = get(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    const newCat = {
      category_id: 'cat-' + Date.now(),
      category_name: catData.category_name,
      description: catData.description || '',
      icon: catData.icon || '🏷️',
      is_active: true,
    };
    list.push(newCat);
    set(STORAGE_KEYS.CATEGORIES, list);
    return newCat;
  },
  updateCategory: (id, updates) => {
    const list = get(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    const updated = list.map((c) => (c.category_id === id ? { ...c, ...updates } : c));
    set(STORAGE_KEYS.CATEGORIES, updated);
  },
  deleteCategory: (id) => {
    const list = get(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    const updated = list.filter((c) => c.category_id !== id);
    set(STORAGE_KEYS.CATEGORIES, updated);
  },

  // Brands
  getBrands: () => get(STORAGE_KEYS.BRANDS, DEFAULT_BRANDS),
  addBrand: (brandData) => {
    const list = get(STORAGE_KEYS.BRANDS, DEFAULT_BRANDS);
    const trimmed = (brandData.brand_name || '').trim();
    if (!trimmed) {
      throw new Error('Brand name is required.');
    }
    const exists = list.some((b) => b.brand_name && b.brand_name.trim().toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      throw new Error(`Brand name "${trimmed}" already exists. Brand names must be unique.`);
    }
    const newBrand = {
      brand_id: 'brd-' + Date.now(),
      brand_name: trimmed,
      description: brandData.description || '',
      origin: brandData.origin || 'International',
      is_active: true,
    };
    list.push(newBrand);
    set(STORAGE_KEYS.BRANDS, list);
    return newBrand;
  },
  updateBrand: (id, updates) => {
    const list = get(STORAGE_KEYS.BRANDS, DEFAULT_BRANDS);
    if (updates.brand_name !== undefined) {
      const trimmed = updates.brand_name.trim();
      if (!trimmed) {
        throw new Error('Brand name cannot be empty.');
      }
      const exists = list.some(
        (b) => b.brand_id !== id && b.brand_name && b.brand_name.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (exists) {
        throw new Error(`Brand name "${trimmed}" already exists. Brand names must be unique.`);
      }
      updates = { ...updates, brand_name: trimmed };
    }
    const updated = list.map((b) => (b.brand_id === id ? { ...b, ...updates } : b));
    set(STORAGE_KEYS.BRANDS, updated);
  },
  deleteBrand: (id) => {
    const list = get(STORAGE_KEYS.BRANDS, DEFAULT_BRANDS);
    const updated = list.filter((b) => b.brand_id !== id);
    set(STORAGE_KEYS.BRANDS, updated);
  },

  // Promotions & Offers
  getPromotions: () => get(STORAGE_KEYS.PROMOTIONS, DEFAULT_PROMOTIONS),
  getActivePromotions: () => {
    const list = get(STORAGE_KEYS.PROMOTIONS, DEFAULT_PROMOTIONS);
    return list.filter((p) => p.status === 'ACTIVE');
  },
  validateCoupon: (code, subtotal, customerEmail = null) => {
    const list = get(STORAGE_KEYS.PROMOTIONS, DEFAULT_PROMOTIONS);
    const promo = list.find((p) => p.promotion_code.toUpperCase() === code.trim().toUpperCase());
    if (!promo) {
      return { valid: false, message: 'Invalid coupon code.' };
    }
    if (promo.status !== 'ACTIVE') {
      return { valid: false, message: 'This coupon has expired or is no longer active.' };
    }

    // Check One-Time Use policy in local store orders
    const orders = get(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
    const normalizedEmail = (customerEmail || '').trim().toLowerCase();
    if (normalizedEmail) {
      const alreadyUsed = orders.some((o) => {
        const oCode = (o.promo_code || '').trim().toUpperCase();
        const oEmail = (o.customer_email || '').trim().toLowerCase();
        const notCancelled = o.status !== 'CANCELLED';
        return notCancelled && oCode === promo.promotion_code.toUpperCase() && oEmail === normalizedEmail;
      });

      if (alreadyUsed) {
        return {
          valid: false,
          message: `Coupon "${promo.promotion_code}" has already been used. Promotions and offer coupons are only valid for one-time use.`,
        };
      }
    }

    if (promo.min_spend && subtotal < promo.min_spend) {
      return { valid: false, message: `Minimum order amount of Rs. ${promo.min_spend.toLocaleString()} required.` };
    }
    let discountAmount = 0;
    if (promo.discount_type === 'PERCENTAGE') {
      discountAmount = (subtotal * promo.discount_value) / 100;
    } else {
      discountAmount = Math.min(promo.discount_value, subtotal);
    }
    return {
      valid: true,
      promo,
      discountAmount,
      message: `Coupon "${promo.promotion_code}" applied successfully!`,
    };
  },
  addPromotion: (data) => {
    const list = get(STORAGE_KEYS.PROMOTIONS, DEFAULT_PROMOTIONS);
    const newPromo = {
      promotion_id: 'promo-' + Date.now(),
      promotion_code: data.promotion_code.toUpperCase().trim(),
      title: data.title || `${data.promotion_code} Offer`,
      description: data.description || '',
      discount_type: data.discount_type || 'PERCENTAGE',
      discount_value: Number(data.discount_value) || 10,
      min_spend: Number(data.min_spend) || 0,
      start_date: data.start_date || new Date().toISOString().split('T')[0],
      end_date: data.end_date || '2026-12-31',
      status: 'ACTIVE',
    };
    list.unshift(newPromo);
    set(STORAGE_KEYS.PROMOTIONS, list);
    return newPromo;
  },
  updatePromotion: (id, updates) => {
    const list = get(STORAGE_KEYS.PROMOTIONS, DEFAULT_PROMOTIONS);
    const updated = list.map((p) => (p.promotion_id === id ? { ...p, ...updates } : p));
    set(STORAGE_KEYS.PROMOTIONS, updated);
  },
  deletePromotion: (id) => {
    const list = get(STORAGE_KEYS.PROMOTIONS, DEFAULT_PROMOTIONS);
    const updated = list.filter((p) => p.promotion_id !== id);
    set(STORAGE_KEYS.PROMOTIONS, updated);
  },

  // Orders
  getOrders: () => get(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS),
  getOrderById: (orderId) => {
    const list = get(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
    return list.find((o) => o.order_id === orderId);
  },
  createOrder: (orderPayload) => {
    const list = get(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);

    // Enforce One-Time Use policy
    if (orderPayload.promo_code) {
      const pCode = orderPayload.promo_code.trim().toUpperCase();
      const custEmail = (orderPayload.customer_email || '').trim().toLowerCase();
      if (custEmail) {
        const alreadyUsed = list.some((o) => {
          const oCode = (o.promo_code || '').trim().toUpperCase();
          const oEmail = (o.customer_email || '').trim().toLowerCase();
          return o.status !== 'CANCELLED' && oCode === pCode && oEmail === custEmail;
        });
        if (alreadyUsed) {
          throw new Error(`Coupon code '${orderPayload.promo_code}' has already been used. Promotions are only valid for one-time use.`);
        }
      }
    }

    const newOrder = {
      order_id: 'SS' + Date.now().toString().slice(-6),
      order_date: new Date().toISOString(),
      status: 'PENDING',
      ...orderPayload,
    };
    list.unshift(newOrder);
    set(STORAGE_KEYS.ORDERS, list);

    if (orderPayload.order_items && Array.isArray(orderPayload.order_items)) {
      orderPayload.order_items.forEach((item) => {
        Store.adjustStock(item.product_id, -item.quantity);
      });
    }

    return newOrder;
  },
  updateOrderStatus: (orderId, newStatus, staffName = null) => {
    const list = get(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
    const updated = list.map((o) => {
      if (o.order_id === orderId) {
        return {
          ...o,
          status: newStatus,
          ...(staffName && { staff_name: staffName }),
        };
      }
      return o;
    });
    set(STORAGE_KEYS.ORDERS, updated);
  },

  // Customer Reviews
  getReviews: () => {
    return get(STORAGE_KEYS.REVIEWS, DEFAULT_REVIEWS);
  },
  getProductReviews: (productId) => {
    const list = get(STORAGE_KEYS.REVIEWS, DEFAULT_REVIEWS);
    return list.filter((r) => r.product_id === productId || r.product_id === String(productId));
  },
  submitReview: (reviewData) => {
    const list = get(STORAGE_KEYS.REVIEWS, DEFAULT_REVIEWS);
    const ratingVal = Number(reviewData.rating) || 5;
    const newReview = {
      review_id: 'rev-' + Date.now(),
      product_id: reviewData.product_id,
      customer_name: reviewData.customer_name || 'Verified Customer',
      rating: ratingVal,
      rating_stars: reviewData.rating_stars || formatStars(ratingVal),
      comment: reviewData.comment || '',
      status: 'APPROVED',
      review_date: new Date().toISOString(),
    };
    list.unshift(newReview);
    set(STORAGE_KEYS.REVIEWS, list);
    Store.recalculateProductRating(reviewData.product_id);
    return newReview;
  },
  updateReview: (reviewId, updateData) => {
    const list = get(STORAGE_KEYS.REVIEWS, DEFAULT_REVIEWS);
    let targetProdId = null;
    const updated = list.map((r) => {
      if (r.review_id === reviewId) {
        targetProdId = r.product_id;
        const newRating = updateData.rating !== undefined ? Number(updateData.rating) : r.rating;
        return {
          ...r,
          rating: newRating,
          rating_stars: formatStars(newRating),
          comment: updateData.comment !== undefined ? updateData.comment : r.comment,
          customer_name: updateData.customer_name || r.customer_name,
        };
      }
      return r;
    });
    set(STORAGE_KEYS.REVIEWS, updated);
    if (targetProdId) Store.recalculateProductRating(targetProdId);
    return updated.find((r) => r.review_id === reviewId);
  },
  deleteReview: (reviewId) => {
    const list = get(STORAGE_KEYS.REVIEWS, DEFAULT_REVIEWS);
    const target = list.find((r) => r.review_id === reviewId);
    const updated = list.filter((r) => r.review_id !== reviewId);
    set(STORAGE_KEYS.REVIEWS, updated);
    if (target?.product_id) Store.recalculateProductRating(target.product_id);
  },
  recalculateProductRating: (productId) => {
    if (!productId) return;
    const reviews = get(STORAGE_KEYS.REVIEWS, DEFAULT_REVIEWS).filter(
      (r) => (r.product_id === productId || r.product_id === String(productId)) && r.status === 'APPROVED'
    );
    const avg = reviews.length > 0
      ? Number((reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1))
      : 5.0;
    const prods = get(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    const updatedProds = prods.map((p) => {
      if (p.product_id === productId || p.id === productId) {
        return { ...p, rating: avg, rating_stars: formatStars(avg) };
      }
      return p;
    });
    set(STORAGE_KEYS.PRODUCTS, updatedProds);
  },

  getActiveRole: () => 'CUSTOMER',
  setActiveRole: (role) => {},

  resetAllData: () => {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.BRANDS);
    localStorage.removeItem(STORAGE_KEYS.PROMOTIONS);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.REVIEWS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    initStore();
  },
};

initStore();
export default Store;
