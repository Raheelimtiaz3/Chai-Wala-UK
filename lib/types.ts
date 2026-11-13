export type UserRole = 'customer' | 'admin';

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  default_address: string;
  default_postcode: string;
  points_balance: number;
  created_at: string;
}

export interface RewardLedgerEntry {
  id: number;
  user_id: number;
  order_id: number | null;
  order_number: string | null;
  points_delta: number;
  description: string;
  created_at: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  label: string;
  weight_grams: number;
  sku: string;
  price_pence: number;
  is_placeholder_price: number;
  stock: number;
  active: number;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  subtitle: string;
  product_type: string;
  description: string;
  tasting_notes: string;
  brewing_guide: string;
  ingredients_note: string;
  images: string[];
  featured: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  variants: ProductVariant[];
}

export interface ProductReview {
  id: number;
  product_id: number;
  user_id: number | null;
  author_name: string;
  rating: number;
  title: string;
  comment: string;
  verified_purchase: boolean;
  created_at: string;
}

export interface CartItem {
  productId: number;
  variantId: number;
  slug: string;
  name: string;
  variantLabel: string;
  pricePence: number;
  image: string;
  quantity: number;
  maxStock: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'dispatched'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cod_pending'
  | 'refunded';

export type PaymentMethod = 'stripe_card' | 'cash_on_delivery';
export type ShippingMethod = 'standard' | 'express';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number;
  product_name: string;
  variant_label: string;
  unit_price_pence: number;
  quantity: number;
  line_total_pence: number;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  county: string;
  postcode: string;
  delivery_instructions: string;
  shipping_method: ShippingMethod;
  subtotal_pence: number;
  discount_code: string | null;
  discount_pence: number;
  shipping_pence: number;
  total_pence: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  stripe_payment_intent_id: string | null;
  order_status: OrderStatus;
  tracking_reference: string | null;
  courier_name: string | null;
  points_earned: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface DiscountCode {
  id: number;
  code: string;
  discount_type: 'percent' | 'fixed';
  value: number;
  min_order_pence: number;
  active: boolean;
  usage_count: number;
  expires_at: string | null;
  created_at: string;
}

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string;
  author: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface SiteSettings {
  shipping: {
    standardRatePence: number;
    expressRatePence: number;
    freeThresholdPence: number;
    deliveryNote: string;
  };
  payment: {
    stripeEnabled: boolean;
    codEnabled: boolean;
  };
  business: {
    brandName: string;
    tagline: string;
    slogan: string;
    announcementBar: string;
    contactEmail: string;
    contactPhone: string;
    businessAddress: string;
    companyNumber: string;
    socialInstagram: string;
    socialFacebook: string;
    socialTikTok: string;
    socialYouTube: string;
  };
  content: {
    heroHeading: string;
    heroBrandName: string;
    heroSupportText: string;
    aboutHeading: string;
    aboutStory: string;
    ourTeaHeading: string;
    ourTeaStory: string;
  };
  faqs: FaqItem[];
  policies: {
    privacy: string;
    terms: string;
    shipping: string;
    returns: string;
    cookies: string;
  };
}
