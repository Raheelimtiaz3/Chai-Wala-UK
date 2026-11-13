import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import type {
  BlogPost,
  DiscountCode,
  Order,
  OrderItem,
  Product,
  ProductReview,
  ProductVariant,
  RewardLedgerEntry,
  SiteSettings,
  UserRecord,
} from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'chaiwala.db');

let dbInstance: DatabaseSync | null = null;

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  shipping: {
    standardRatePence: 395,
    expressRatePence: 795,
    freeThresholdPence: 4000,
    deliveryNote:
      'UK delivery timeframes and courier details will be confirmed once your order is dispatched. Shipping rates are editable in Admin Settings.',
  },
  payment: {
    stripeEnabled: true,
    codEnabled: false,
  },
  business: {
    brandName: 'CHAI WALA',
    tagline: 'TEA • TRADITION • GOOD MOOD',
    slogan: 'Authentic Taste… Now in the UK!',
    announcementBar: 'Premium Quality Tea | UK Delivery | Discover the Taste of Tradition',
    contactEmail: '[Editable in Admin: Contact Email]',
    contactPhone: '[Editable in Admin: UK Contact Phone]',
    businessAddress: '[Editable in Admin: Registered UK Business Address]',
    companyNumber: '[Editable in Admin: UK Company Registration Number]',
    socialInstagram: 'https://instagram.com',
    socialFacebook: 'https://facebook.com',
    socialTikTok: 'https://tiktok.com',
    socialYouTube: 'https://youtube.com',
  },
  content: {
    heroHeading: 'Authentic Taste… Now in the UK!',
    heroBrandName: 'Chai Wala',
    heroSupportText:
      'Bringing the warmth, richness and tradition of authentic desi chai to tea lovers across the United Kingdom.',
    aboutHeading: "More Than Just Tea. It's a Tradition.",
    aboutStory:
      'Chai Wala brings the traditional love of desi chai to the United Kingdom. Our mission is to share rich tea flavour, warmth and memorable tea moments with every cup.\n\nFrom quiet morning rituals to lively evening gatherings with family and friends, our blends are crafted for tea lovers across Britain who appreciate bold colour, comforting aroma and authentic character.',
    ourTeaHeading: 'Crafted for Proper Stovetop Chai',
    ourTeaStory:
      'True desi chai requires a tea blend with the depth and body to stand up to simmering milk and gentle spice.\n\n[Editable Placeholder in Admin: Add your verified tea garden origin, harvest season, leaf grade, and final ingredient specification here once supplier documentation is confirmed.]',
  },
  faqs: [
    {
      id: 'faq-1',
      question: 'How do I brew Chai Wala Premium Tea Blend?',
      answer:
        'Bring water to a gentle boil in a saucepan, add Chai Wala Tea Blend and simmer briefly before pouring in milk and sweetening to taste. Exact spoon-to-cup ratios can be adjusted in the Admin Brewing Guide once your final blend specification is confirmed.',
    },
    {
      id: 'faq-2',
      question: 'Where in the UK do you deliver?',
      answer:
        'We validate and accept UK delivery postcodes across Great Britain and Northern Ireland. Standard and Express shipping options are selectable at checkout.',
    },
    {
      id: 'faq-3',
      question: 'When will my order arrive?',
      answer:
        'Estimated delivery timeframes will be confirmed as soon as courier arrangements are finalised and your parcel receives a tracking reference.',
    },
    {
      id: 'faq-4',
      question: 'What payment methods are accepted?',
      answer:
        'We accept secure card payments, Apple Pay and Google Pay via Stripe. Cash on Delivery may also appear at checkout when enabled by the store administrator.',
    },
    {
      id: 'faq-5',
      question: 'Are ingredients and allergen details listed on the packaging?',
      answer:
        '[Editable in Admin: Update this answer with final UK Food Standards Agency compliant allergen, ingredient and batch labelling details prior to launch.]',
    },
  ],
  policies: {
    privacy:
      'CHAI WALA Privacy Policy (Editable Placeholder)\n\nPlease update this policy in the Admin Dashboard with your UK GDPR Data Controller details, registered UK business address, ICO registration (if applicable), and retention schedule.\n\n1. Information We Collect\nWhen you place an order, create an account, or contact CHAI WALA, we collect your name, email address, phone number, UK delivery address, postcode, and order details strictly to fulfil your order and communicate order updates.\n\n2. Payment Security\nCard payments are processed securely via Stripe. CHAI WALA never stores raw card numbers or CVV codes on its servers.\n\n3. Your Rights\nUnder UK GDPR, you have the right to access, rectify, or request deletion of your personal data. Contact details can be updated by the store administrator in Settings.',
    terms:
      'CHAI WALA Terms & Conditions (Editable Placeholder)\n\nPlease update this document in the Admin Dashboard with your legal entity name, company registration number, and registered UK address before going live.\n\n1. Orders & Pricing\nAll prices are displayed in Pounds Sterling (GBP £). Product prices and delivery fees shown during initial store setup are editable placeholders until confirmed by the administrator.\n\n2. UK Delivery\nOrders require a valid UK delivery postcode. Delivery schedules are subject to courier confirmation.\n\n3. Governing Law\nThese terms are governed by the laws of England and Wales (or applicable UK jurisdiction).',
    shipping:
      'CHAI WALA Shipping & Delivery Policy (Editable Placeholder)\n\n1. UK Coverage\nOrders are dispatched to valid UK postcodes. Standard and Express delivery charges, as well as the free standard delivery threshold, are configured by the store administrator.\n\n2. Courier & Dispatch Confirmation\nNo specific courier transit times are guaranteed until courier arrangements are confirmed. Once dispatched, tracking details are added to your order and accessible on the Order Tracking page.',
    returns:
      'CHAI WALA Returns & Refund Policy (Editable Placeholder)\n\nPlease customise this policy in the Admin Dashboard in accordance with the UK Consumer Rights Act 2015 and Consumer Contracts Regulations.\n\n1. Unopened Tea Products\nUnopened, sealed tea packaging may be eligible for return within the statutory period.\n\n2. Damaged or Incorrect Items\nIf an order arrives damaged or incorrect, please contact our team with your Order Reference so we can arrange a replacement or refund.',
    cookies:
      'CHAI WALA Cookie Policy (Editable Placeholder)\n\n1. Essential Cookies\nWe use strictly necessary HTTP-only session cookies to maintain your authenticated account session and local storage to preserve your shopping basket between visits.\n\n2. Payment Cookies\nWhen paying by card, Apple Pay or Google Pay, Stripe may set essential fraud-prevention cookies.',
  },
};

export function getDb(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  initializeSchema(db);
  seedInitialData(db);

  dbInstance = db;
  return db;
}

function initializeSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      phone TEXT DEFAULT '',
      default_address TEXT DEFAULT '',
      default_postcode TEXT DEFAULT '',
      points_balance INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      subtitle TEXT NOT NULL DEFAULT '',
      product_type TEXT NOT NULL DEFAULT 'Tea Powder / Chai Blend',
      description TEXT NOT NULL,
      tasting_notes TEXT NOT NULL DEFAULT '',
      brewing_guide TEXT NOT NULL DEFAULT '',
      ingredients_note TEXT NOT NULL DEFAULT '',
      images_json TEXT NOT NULL DEFAULT '[]',
      featured INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      weight_grams INTEGER NOT NULL DEFAULT 250,
      sku TEXT NOT NULL,
      price_pence INTEGER NOT NULL,
      is_placeholder_price INTEGER NOT NULL DEFAULT 1,
      stock INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER,
      author_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      title TEXT NOT NULL,
      comment TEXT NOT NULL,
      verified_purchase INTEGER NOT NULL DEFAULT 0,
      approved INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      address_line1 TEXT NOT NULL,
      address_line2 TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL,
      county TEXT NOT NULL DEFAULT '',
      postcode TEXT NOT NULL,
      delivery_instructions TEXT NOT NULL DEFAULT '',
      shipping_method TEXT NOT NULL DEFAULT 'standard',
      subtotal_pence INTEGER NOT NULL,
      discount_code TEXT,
      discount_pence INTEGER NOT NULL DEFAULT 0,
      shipping_pence INTEGER NOT NULL DEFAULT 0,
      total_pence INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      stripe_payment_intent_id TEXT,
      order_status TEXT NOT NULL DEFAULT 'pending',
      tracking_reference TEXT,
      courier_name TEXT,
      points_earned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      variant_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      variant_label TEXT NOT NULL,
      unit_price_pence INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      line_total_pence INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS discount_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      discount_type TEXT NOT NULL DEFAULT 'percent',
      value INTEGER NOT NULL,
      min_order_pence INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      usage_count INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      cover_image TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT 'CHAI WALA Editorial',
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      consent_given INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      recipient_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      body_preview TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reward_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      order_id INTEGER,
      order_number TEXT,
      points_delta INTEGER NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Safe migrations for existing SQLite databases
  const userCols = db.prepare('PRAGMA table_info(users)').all() as { name: string }[];
  if (!userCols.some((c) => c.name === 'points_balance')) {
    db.exec('ALTER TABLE users ADD COLUMN points_balance INTEGER NOT NULL DEFAULT 0;');
  }
  const orderCols = db.prepare('PRAGMA table_info(orders)').all() as { name: string }[];
  if (!orderCols.some((c) => c.name === 'points_earned')) {
    db.exec('ALTER TABLE orders ADD COLUMN points_earned INTEGER NOT NULL DEFAULT 0;');
  }
}

function seedInitialData(db: DatabaseSync) {
  const now = new Date().toISOString();

  // 1. Seed default Admin account (configurable via ADMIN_EMAIL / ADMIN_PASSWORD)
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@chaiwala.co.uk').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChaiWalaAdmin2026!';
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!existingAdmin) {
    const hash = bcrypt.hashSync(adminPassword, 10);
    db.prepare(
      `INSERT INTO users (name, email, password_hash, role, created_at)
       VALUES (?, ?, ?, 'admin', ?)`
    ).run('CHAI WALA Administrator', adminEmail, hash, now);
  }

  // 2. Seed Site Settings if missing
  const settingsKeys = Object.keys(DEFAULT_SITE_SETTINGS) as (keyof SiteSettings)[];
  for (const key of settingsKeys) {
    const exists = db.prepare('SELECT key FROM site_settings WHERE key = ?').get(key);
    if (!exists) {
      db.prepare(
        `INSERT INTO site_settings (key, value_json, updated_at) VALUES (?, ?, ?)`
      ).run(key, JSON.stringify(DEFAULT_SITE_SETTINGS[key]), now);
    }
  }

  // 3. Seed Initial Product: Chai Wala Premium Tea Blend (with clearly marked editable placeholders)
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (productCount.count === 0) {
    const insertProduct = db.prepare(
      `INSERT INTO products (
        slug, name, subtitle, product_type, description, tasting_notes,
        brewing_guide, ingredients_note, images_json, featured, active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`
    );
    const res = insertProduct.run(
      'chai-wala-premium-tea-blend',
      'Chai Wala Premium Tea Blend',
      'Signature UK Desi Chai Loose Tea Powder',
      'Tea Powder / Chai Blend',
      'Crafted for authentic stovetop chai across the United Kingdom. [Editable Placeholder: Add final blend story, tea garden provenance, and aroma profile in the Admin Dashboard once supplier specifications are confirmed.]',
      '[Editable Placeholder: Rich malty body, deep amber liquor, balanced briskness designed for whole milk or plant-based milk.]',
      '[Editable Placeholder: Simmer 1–2 teaspoons per cup in boiling water, add milk and sweetener to taste, and allow to rise gently before straining.]',
      'Editable Placeholder — Do not treat as final specification: Update verified ingredients, allergen declarations, origin, and batch details in Admin Dashboard prior to live retail launch.',
      JSON.stringify([
        '/images/chai-wala-pouch-cup.jpg',
        '/images/chai-wala-250g.jpg',
        '/images/chai-wala-500g.jpg',
        '/images/chai-wala-1kg.jpg',
        '/images/chai-wala-spices.jpg',
        '/images/chai-wala-kettle.jpg',
        '/images/chai-wala-collection.jpg',
      ]),
      now,
      now
    );

    const productId = Number(res.lastInsertRowid);
    const insertVariant = db.prepare(
      `INSERT INTO product_variants (
        product_id, label, weight_grams, sku, price_pence, is_placeholder_price, stock, active
      ) VALUES (?, ?, ?, ?, ?, 1, ?, 1)`
    );
    insertVariant.run(productId, '250g', 250, 'CW-PTB-250', 895, 50);
    insertVariant.run(productId, '500g', 500, 'CW-PTB-500', 1650, 40);
    insertVariant.run(productId, '1kg', 1000, 'CW-PTB-1000', 2950, 25);
  }

  // 4. Seed Blog Posts if empty (factual cultural & brewing posts without health claims)
  const blogCount = db.prepare('SELECT COUNT(*) as count FROM blog_posts').get() as { count: number };
  if (blogCount.count === 0) {
    const insertBlog = db.prepare(
      `INSERT INTO blog_posts (slug, title, excerpt, content, cover_image, author, published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
    );
    insertBlog.run(
      'the-art-of-stovetop-desi-chai',
      'The Ritual of Stovetop Desi Chai in British Kitchens',
      'Why simmering tea leaves slowly with milk creates a warmth and texture no kettle bag can replicate.',
      'Across Britain, tea is an everyday anchor—from morning mugs before the commute to afternoon pauses when rain taps against the window. Yet stovetop desi chai invites a slightly slower, more sensory rhythm.\n\nUnlike quick steeping in a mug, traditional chai brings water, tea powder, and milk together in a small saucepan. As the tea simmers, the colour deepens into rich mahogany before lightening to burnished caramel when milk joins the pot.\n\nAt CHAI WALA, our focus is bringing that familiar, comforting ritual to UK homes with a blend built specifically for stovetop brewing. Use our editable brewing notes as a starting point and tailor strength, milk, and sweetness to your household tradition.',
      '/images/chai-wala-kettle.jpg',
      'CHAI WALA Editorial',
      now,
      now
    );
    insertBlog.run(
      'spices-and-strainers-building-your-chai-station',
      'Spices, Strainers & Patience: Setting Up a Home Chai Corner',
      'A practical guide to the essential tools—saucepan, fine mesh strainer, and airtight caddy—for consistent chai every day.',
      'Making memorable chai at home does not require elaborate equipment. Three simple pieces make all the difference:\n\n1. A Heavy-Bottomed Saucepan\nEven heat distribution keeps milk from scorching while allowing the tea to rise cleanly.\n\n2. A Fine-Mesh Brass or Stainless Strainer\nTea powder blends release rich colour rapidly and need a fine mesh strainer for a smooth, velvety pour.\n\n3. An Airtight Tea Caddy\nTea absorbs ambient kitchen moisture and aromas quickly. Storing your 250g, 500g, or 1kg pack in a sealed tin away from direct heat preserves aroma from the first spoonful to the last.',
      '/images/chai-wala-spices.jpg',
      'CHAI WALA Editorial',
      now,
      now
    );
  }

  // Upgrade untouched seed photography to official CHAI WALA branded visuals
  const officialProductImages = JSON.stringify([
    '/images/chai-wala-pouch-cup.jpg',
    '/images/chai-wala-250g.jpg',
    '/images/chai-wala-500g.jpg',
    '/images/chai-wala-1kg.jpg',
    '/images/chai-wala-spices.jpg',
    '/images/chai-wala-kettle.jpg',
    '/images/chai-wala-collection.jpg',
  ]);
  const legacyProductImages = JSON.stringify([
    '/images/product_chai_tin.jpg',
    '/images/story_tea_craft.jpg',
  ]);
  db.prepare(
    `UPDATE products SET images_json = ?, updated_at = ? WHERE slug = 'chai-wala-premium-tea-blend' AND images_json = ?`
  ).run(officialProductImages, now, legacyProductImages);

  db.prepare(
    `UPDATE blog_posts SET cover_image = '/images/chai-wala-kettle.jpg' WHERE cover_image = '/images/london_tea_ritual.jpg'`
  ).run();
  db.prepare(
    `UPDATE blog_posts SET cover_image = '/images/chai-wala-spices.jpg' WHERE cover_image = '/images/blog_chai_spices.jpg'`
  ).run();
}

export function getSiteSettings(): SiteSettings {
  const db = getDb();
  const rows = db.prepare('SELECT key, value_json FROM site_settings').all() as {
    key: string;
    value_json: string;
  }[];

  const merged: SiteSettings = JSON.parse(JSON.stringify(DEFAULT_SITE_SETTINGS));
  for (const row of rows) {
    try {
      const parsed = JSON.parse(row.value_json);
      if (row.key in merged) {
        (merged as unknown as Record<string, unknown>)[row.key] = parsed;
      }
    } catch {
      // Ignore malformed row
    }
  }
  return merged;
}

export function updateSiteSettingsSection<K extends keyof SiteSettings>(
  key: K,
  value: SiteSettings[K]
): SiteSettings {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO site_settings (key, value_json, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`
  ).run(key, JSON.stringify(value), now);
  return getSiteSettings();
}

export function listProducts(includeInactive = false): Product[] {
  const db = getDb();
  const rows = db
    .prepare(
      includeInactive
        ? 'SELECT * FROM products ORDER BY featured DESC, id ASC'
        : 'SELECT * FROM products WHERE active = 1 ORDER BY featured DESC, id ASC'
    )
    .all() as Record<string, unknown>[];

  return rows.map((row) => hydrateProduct(db, row, includeInactive));
}

export function getProductBySlug(slug: string, includeInactive = false): Product | null {
  const db = getDb();
  const row = db
    .prepare(
      includeInactive
        ? 'SELECT * FROM products WHERE slug = ?'
        : 'SELECT * FROM products WHERE slug = ? AND active = 1'
    )
    .get(slug) as Record<string, unknown> | undefined;

  if (!row) return null;
  return hydrateProduct(db, row, includeInactive);
}

export function getProductById(id: number, includeInactive = true): Product | null {
  const db = getDb();
  const row = db
    .prepare(
      includeInactive
        ? 'SELECT * FROM products WHERE id = ?'
        : 'SELECT * FROM products WHERE id = ? AND active = 1'
    )
    .get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return hydrateProduct(db, row, includeInactive);
}

function hydrateProduct(
  db: DatabaseSync,
  row: Record<string, unknown>,
  includeInactive: boolean
): Product {
  const variantRows = db
    .prepare(
      includeInactive
        ? 'SELECT * FROM product_variants WHERE product_id = ? ORDER BY weight_grams ASC, id ASC'
        : 'SELECT * FROM product_variants WHERE product_id = ? AND active = 1 ORDER BY weight_grams ASC, id ASC'
    )
    .all(Number(row.id)) as Record<string, unknown>[];

  const variants: ProductVariant[] = variantRows.map((v) => ({
    id: Number(v.id),
    product_id: Number(v.product_id),
    label: String(v.label),
    weight_grams: Number(v.weight_grams),
    sku: String(v.sku),
    price_pence: Number(v.price_pence),
    is_placeholder_price: Number(v.is_placeholder_price),
    stock: Number(v.stock),
    active: Number(v.active),
  }));

  let images: string[] = [];
  try {
    images = JSON.parse(String(row.images_json || '[]'));
  } catch {
    images = [];
  }

  return {
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    subtitle: String(row.subtitle || ''),
    product_type: String(row.product_type || 'Tea Powder / Chai Blend'),
    description: String(row.description || ''),
    tasting_notes: String(row.tasting_notes || ''),
    brewing_guide: String(row.brewing_guide || ''),
    ingredients_note: String(row.ingredients_note || ''),
    images,
    featured: Boolean(row.featured),
    active: Boolean(row.active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    variants,
  };
}

export function listProductReviews(productId: number): ProductReview[] {
  const db = getDb();
  const rows = db
    .prepare(
      'SELECT * FROM reviews WHERE product_id = ? AND approved = 1 ORDER BY created_at DESC'
    )
    .all(productId) as Record<string, unknown>[];

  return rows.map((r) => ({
    id: Number(r.id),
    product_id: Number(r.product_id),
    user_id: r.user_id !== null ? Number(r.user_id) : null,
    author_name: String(r.author_name),
    rating: Number(r.rating),
    title: String(r.title),
    comment: String(r.comment),
    verified_purchase: Boolean(r.verified_purchase),
    created_at: String(r.created_at),
  }));
}

export function hydrateOrder(db: DatabaseSync, row: Record<string, unknown>): Order {
  const itemRows = db
    .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC')
    .all(Number(row.id)) as Record<string, unknown>[];

  const items: OrderItem[] = itemRows.map((item) => ({
    id: Number(item.id),
    order_id: Number(item.order_id),
    product_id: Number(item.product_id),
    variant_id: Number(item.variant_id),
    product_name: String(item.product_name),
    variant_label: String(item.variant_label),
    unit_price_pence: Number(item.unit_price_pence),
    quantity: Number(item.quantity),
    line_total_pence: Number(item.line_total_pence),
  }));

  return {
    id: Number(row.id),
    order_number: String(row.order_number),
    user_id: row.user_id !== null ? Number(row.user_id) : null,
    customer_name: String(row.customer_name),
    customer_email: String(row.customer_email),
    customer_phone: String(row.customer_phone),
    address_line1: String(row.address_line1),
    address_line2: String(row.address_line2 || ''),
    city: String(row.city),
    county: String(row.county || ''),
    postcode: String(row.postcode),
    delivery_instructions: String(row.delivery_instructions || ''),
    shipping_method: String(row.shipping_method) as Order['shipping_method'],
    subtotal_pence: Number(row.subtotal_pence),
    discount_code: row.discount_code ? String(row.discount_code) : null,
    discount_pence: Number(row.discount_pence || 0),
    shipping_pence: Number(row.shipping_pence || 0),
    total_pence: Number(row.total_pence),
    payment_method: String(row.payment_method) as Order['payment_method'],
    payment_status: String(row.payment_status) as Order['payment_status'],
    stripe_payment_intent_id: row.stripe_payment_intent_id
      ? String(row.stripe_payment_intent_id)
      : null,
    order_status: String(row.order_status) as Order['order_status'],
    tracking_reference: row.tracking_reference ? String(row.tracking_reference) : null,
    courier_name: row.courier_name ? String(row.courier_name) : null,
    points_earned: Number(row.points_earned || 0),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    items,
  };
}

export function listBlogPosts(includeDrafts = false): BlogPost[] {
  const db = getDb();
  const rows = db
    .prepare(
      includeDrafts
        ? 'SELECT * FROM blog_posts ORDER BY created_at DESC'
        : 'SELECT * FROM blog_posts WHERE published = 1 ORDER BY created_at DESC'
    )
    .all() as Record<string, unknown>[];

  return rows.map((r) => ({
    id: Number(r.id),
    slug: String(r.slug),
    title: String(r.title),
    excerpt: String(r.excerpt),
    content: String(r.content),
    cover_image: String(r.cover_image),
    author: String(r.author),
    published: Boolean(r.published),
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  }));
}

export function listDiscountCodes(): DiscountCode[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM discount_codes ORDER BY created_at DESC')
    .all() as Record<string, unknown>[];

  return rows.map((r) => ({
    id: Number(r.id),
    code: String(r.code),
    discount_type: String(r.discount_type) as 'percent' | 'fixed',
    value: Number(r.value),
    min_order_pence: Number(r.min_order_pence),
    active: Boolean(r.active),
    usage_count: Number(r.usage_count),
    expires_at: r.expires_at ? String(r.expires_at) : null,
    created_at: String(r.created_at),
  }));
}

export function getUserById(id: number): UserRecord | null {
  const db = getDb();
  const row = db
    .prepare(
      'SELECT id, name, email, role, phone, default_address, default_postcode, points_balance, created_at FROM users WHERE id = ?'
    )
    .get(id) as Record<string, unknown> | undefined;

  if (!row) return null;
  return {
    id: Number(row.id),
    name: String(row.name),
    email: String(row.email),
    role: String(row.role) as UserRecord['role'],
    phone: String(row.phone || ''),
    default_address: String(row.default_address || ''),
    default_postcode: String(row.default_postcode || ''),
    points_balance: Number(row.points_balance || 0),
    created_at: String(row.created_at),
  };
}

export function listUserRewardLedger(userId: number): RewardLedgerEntry[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM reward_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT 25')
    .all(userId) as Record<string, unknown>[];

  return rows.map((r) => ({
    id: Number(r.id),
    user_id: Number(r.user_id),
    order_id: r.order_id !== null ? Number(r.order_id) : null,
    order_number: r.order_number ? String(r.order_number) : null,
    points_delta: Number(r.points_delta),
    description: String(r.description),
    created_at: String(r.created_at),
  }));
}
