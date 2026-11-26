export type UserRole = 'buyer' | 'seller' | 'admin';

export type SellerStatus = 'active' | 'pending' | 'suspended';

export type ProductCondition = 'Novo' | 'Recondicionado';

export type OrderStatus = 'Pago' | 'Em Separação' | 'Enviado' | 'Entregue';

export type PaymentMethod = 'credit_card' | 'pix_mobile' | 'bank_transfer';

export type PayoutMethod = 'mpesa' | 'emola' | 'bank_transfer';
export type PayoutStatus = 'pending' | 'paid' | 'rejected';

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
  | { type: 'forgot_password' }
  | { type: 'reset_password'; token?: string }
  | { type: 'seller_dashboard'; tab?: 'overview' | 'products' | 'orders' | 'finance' | 'settings' }
  | { type: 'admin_dashboard'; tab?: 'overview' | 'sellers' | 'catalog' | 'finance' | 'customization' };

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

export const MOZAMBIQUE_PROVINCES = [
  'Maputo Cidade',
  'Maputo Província',
  'Gaza',
  'Inhambane',
  'Sofala',
  'Manica',
  'Tete',
  'Zambézia',
  'Nampula',
  'Cabo Delgado',
  'Niassa',
] as const;

export type MozambiqueProvince = (typeof MOZAMBIQUE_PROVINCES)[number];

export interface Address {
  id: string;
  label: string;
  recipient: string;
  street: string;
  city: string;
  state: string; // Província
  zipCode: string;
  neighborhood?: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string; // pode ser email real ou gerado a partir do telefone
  role: UserRole;
  phone?: string;
  sellerId?: string;
  avatarUrl?: string;
  province?: string;
  city?: string;
  neighborhood?: string;
  zipCode?: string;
  createdAt: string;
}

export interface SellerPayoutInfo {
  bankName: string;
  accountType: string;
  accountNumber: string;
  pixOrWallet: string;
  accountHolder?: string;
  preferredMethod?: PayoutMethod;
}

export interface SellerPayoutRequest {
  id: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  method: PayoutMethod;
  destinationSummary: string;
  payoutSnapshot: SellerPayoutInfo;
  status: PayoutStatus;
  sellerNotes?: string;
  transactionRef?: string;
  proofUrl?: string;
  adminNotes?: string;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
}

export interface SellerSocials {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
}

export interface SellerKycInfo {
  status?: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  fullName?: string;
  documentType?: 'BI' | 'NUIT' | 'Passaporte' | 'Alvara';
  documentNumber?: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface SellerActivationStatus {
  profileCompleted: boolean;
  kycCompleted: boolean;
  feePaid: boolean;
  feeStatus?: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  feePaymentMethod?: 'mpesa' | 'emola';
  feePhone?: string;
  feeTransactionId?: string;
  feeProofUrl?: string;
  feeSubmittedAt?: string;
  feePaidAt?: string;
  feeReceipt?: string;
  feeRejectionReason?: string;
}

export interface SellerStoreTheme {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  tagline?: string;
  announcement?: string;
}

export interface SellerStore {
  id: string;
  ownerUserId: string;
  name: string;
  slug: string;
  documentId: string; // NUIT / BI
  mainCategory: string;
  description: string;
  logoText: string;
  logoUrl?: string;
  accentColor: string;
  bannerImage: string;
  status: SellerStatus;
  verified: boolean;
  rating: number;
  reviewCount: number;
  joinedDate: string;
  tenureLabel: string;
  location: string;
  socials?: SellerSocials;
  theme?: SellerStoreTheme;
  kyc?: SellerKycInfo;
  activation?: SellerActivationStatus;
  payoutInfo: SellerPayoutInfo;
}

export interface ProductSpecs {
  ram?: string;
  storage?: string;
  processor?: string;
  display?: string;
  battery?: string;
  warranty?: string;
  [key: string]: string | undefined;
}

export interface Product {
  id: string;
  sellerId: string;
  title: string;
  brand: string;
  category: string;
  subcategory?: string;
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
  imageUrl?: string;
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

export interface Review {
  id: string;
  targetType: 'seller' | 'product';
  targetId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
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

export interface HeroSlideConfig {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  highlight: string;
  ctaText: string;
  cta?: string;
  imageUrl: string;
  image?: string;
  imageAlt?: string;
  productId?: string;
}

export type BannerRowLayout = '1-col' | '2-cols' | '3-cols' | 'asymmetric';
export type BannerAspectRatio = 'auto' | '16:9' | '1:1' | '4:3' | '21:9';

export interface PromoSubBannerConfig {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  cta?: string;
  category?: string;
  imageUrl: string;
  image?: string;
  imageAlt?: string;
  aspectRatio?: BannerAspectRatio;
}

export interface WidePromoBannerConfig {
  title: string;
  kicker: string;
  description: string;
  ctaText: string;
  cta?: string;
  imageUrl: string;
  image1?: string;
  image2?: string;
  actionType?: string;
}

export interface PartnerBrandConfig {
  id?: string;
  name: string;
  logoUrl?: string;
  ariaLabel?: string;
}

export interface SiteContactConfig {
  phone1: string;
  phone2?: string;
  emailSupport: string;
  emailPartners?: string;
  address: string;
  whatsapp?: string;
  socials: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
  };
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
}

export interface SiteHeaderConfig {
  topBarNotice: string;
  topNotice?: string;
  phone: string;
  supportPhone?: string;
  email: string;
  supportEmail?: string;
  currencyLabel: string;
  currencyDisplay?: string;
}

export interface SiteFooterConfig {
  aboutTitle?: string;
  aboutText: string;
  guaranteeTitle?: string;
  guaranteeText: string;
  copyrightText: string;
}

export type GatewayEnvironment = 'sandbox' | 'production';
export type ActiveCartGateway = 'manual' | 'paysuite' | 'debitopay' | 'mpesa_direct';

export interface PaySuiteGatewayConfig {
  enabled?: boolean;
  environment?: GatewayEnvironment;
  apiKey?: string;
  merchantId?: string;
  webhookSecret?: string;
  baseUrl?: string;
}

export interface DebitoPayGatewayConfig {
  enabled?: boolean;
  environment?: GatewayEnvironment;
  apiKey?: string;
  walletId?: string;
  webhookSecret?: string;
  baseUrl?: string;
}

export interface MpesaDirectGatewayConfig {
  enabled?: boolean;
  environment?: GatewayEnvironment;
  apiKey?: string;
  publicKey?: string;
  serviceProviderCode?: string;
  originHost?: string;
  emolaApiKey?: string;
  emolaApiSecret?: string;
  emolaShortcode?: string;
}

export interface SitePaymentGatewaysConfig {
  activeCartGateway?: ActiveCartGateway;
  escalePayCheckoutUrl?: string;
  escalePayWebhookSecret?: string;
  paySuite?: PaySuiteGatewayConfig;
  debitoPay?: DebitoPayGatewayConfig;
  mpesaDirect?: MpesaDirectGatewayConfig;
}

export interface SiteThemeConfig {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  navyColor: string;
  accentColor: string;
  highlightColor: string;
  surfaceColor: string;
}

export interface SiteCustomization {
  header: SiteHeaderConfig;
  heroSlides: HeroSlideConfig[];
  subBanners: PromoSubBannerConfig[];
  subBannersLayout?: BannerRowLayout;
  wideBanner: WidePromoBannerConfig;
  partnerBrands: PartnerBrandConfig[];
  contact: SiteContactConfig;
  footer: SiteFooterConfig;
  theme?: SiteThemeConfig;
  gateways?: SitePaymentGatewaysConfig;
}
