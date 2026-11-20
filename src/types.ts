export type UserRole = 'buyer' | 'seller' | 'admin';

export type SellerStatus = 'active' | 'pending' | 'suspended';

export type ProductCondition = 'Novo' | 'Recondicionado';

export type OrderStatus = 'Pago' | 'Em Separação' | 'Enviado' | 'Entregue';

export type PaymentMethod = 'credit_card' | 'pix_mobile' | 'bank_transfer';

export type AppView =
  | { type: 'home' }
  | { type: 'about' }
  | { type: 'stores' }
  | { type: 'offers' }
  | { type: 'contact' }
  | { type: 'product'; productId: string }
  | { type: 'store'; sellerId: string }
  | { type: 'cart' }
  | { type: 'profile'; tab?: 'orders' | 'addresses' | 'wishlist' | 'settings' }
  | { type: 'auth'; mode?: 'login' | 'register' }
  | { type: 'seller_dashboard'; tab?: 'overview' | 'products' | 'orders' | 'settings' }
  | { type: 'admin_dashboard'; tab?: 'overview' | 'sellers' | 'catalog' | 'finance' };

export interface Coupon {
  code: string;
  title: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  category?: string;
  validUntil: string;
  active: boolean;
}

export interface Address {
  id: string;
  label: string;
  recipient: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  sellerId?: string;
  createdAt: string;
}

export interface SellerPayoutInfo {
  bankName: string;
  accountType: string;
  accountNumber: string;
  pixOrWallet: string;
}

export interface SellerStore {
  id: string;
  ownerUserId: string;
  name: string;
  slug: string;
  documentId: string; // CNPJ / NIF
  mainCategory: string;
  description: string;
  logoText: string;
  accentColor: string;
  bannerImage: string;
  status: SellerStatus;
  verified: boolean;
  rating: number;
  reviewCount: number;
  joinedDate: string;
  tenureLabel: string;
  location: string;
  payoutInfo: SellerPayoutInfo;
}

export interface ProductSpecs {
  ram?: string;
  storage?: string;
  processor?: string;
  display?: string;
  battery?: string;
  warranty: string;
}

export interface Product {
  id: string;
  sellerId: string;
  title: string;
  brand: string;
  category: string;
  condition: ProductCondition;
  price: number;
  originalPrice?: number;
  stock: number;
  rating: number;
  reviewCount: number;
  soldCount: number;
  isFlashDeal?: boolean;
  isBestSeller?: boolean;
  images: string[];
  description: string;
  specs: ProductSpecs;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  sellerId: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  condition: ProductCondition;
}

export interface OrderSellerFulfillment {
  sellerId: string;
  sellerName: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  status: OrderStatus;
  trackingCode: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  createdAt: string;
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  commissionRateSnapshot: number;
  subtotal: number;
  discountTotal?: number;
  couponCode?: string;
  shippingTotal: number;
  total: number;
  fulfillments: OrderSellerFulfillment[];
}

export interface CatalogFilters {
  search: string;
  category: string;
  condition: 'all' | ProductCondition;
  brand: string;
  minPrice: number | null;
  maxPrice: number | null;
  sortBy: 'featured' | 'price_asc' | 'price_desc' | 'best_selling' | 'rating';
}
