import type {
  CartItem,
  CatalogFilters,
  Order,
  OrderStatus,
  Product,
  ProductCondition,
  SellerStore,
} from '../types';

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'Pago',
  'Em Separação',
  'Enviado',
  'Entregue',
];

export const FREE_SHIPPING_THRESHOLD = 15000;

export function formatCurrency(value: number): string {
  const formatted = new Intl.NumberFormat('pt-MZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted} MT`;
}

export function getNextOrderStatus(current: OrderStatus): OrderStatus | null {
  const idx = ORDER_STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx >= ORDER_STATUS_FLOW.length - 1) return null;
  return ORDER_STATUS_FLOW[idx + 1];
}

export interface ShippingQuote {
  standardCost: number;
  expressCost: number;
  standardDays: string;
  expressDays: string;
  isFreeStandard: boolean;
}

export function calculateShipping(zipCode: string, subtotal: number): ShippingQuote {
  const digits = zipCode.replace(/\D/g, '');
  const firstDigit = digits.length > 0 ? Number(digits[0]) : 1;

  // Regional distance factor based on Mozambican postal zone (1xxx Maputo -> 3xxx Nampula)
  const baseStandard = firstDigit <= 1 ? 250 : firstDigit <= 2 ? 400 : 550;
  const baseExpress = baseStandard + 300;
  const isFreeStandard = subtotal >= FREE_SHIPPING_THRESHOLD;

  return {
    standardCost: isFreeStandard ? 0 : baseStandard,
    expressCost: baseExpress,
    standardDays: firstDigit <= 1 ? '1 a 2 dias úteis' : '3 a 5 dias úteis',
    expressDays: firstDigit <= 1 ? 'Mesmo dia / 24h' : '1 a 2 dias úteis',
    isFreeStandard,
  };
}

export interface SellerCartGroup {
  seller: SellerStore;
  items: Array<{
    product: Product;
    quantity: number;
    lineTotal: number;
  }>;
  subtotal: number;
  shipping: number;
}

export function groupCartBySeller(
  cart: CartItem[],
  products: Product[],
  sellers: SellerStore[],
  zipCode = '1100'
): SellerCartGroup[] {
  const activeSellerMap = new Map<string, SellerStore>();
  for (const s of sellers) {
    if (s.status === 'active') {
      activeSellerMap.set(s.id, s);
    }
  }

  const productMap = new Map<string, Product>();
  for (const p of products) {
    productMap.set(p.id, p);
  }

  const groups = new Map<string, SellerCartGroup>();

  for (const item of cart) {
    if (item.quantity <= 0) continue;
    const product = productMap.get(item.productId);
    if (!product) continue;
    const seller = activeSellerMap.get(product.sellerId);
    if (!seller) continue;

    const existing = groups.get(seller.id);
    const lineTotal = product.price * item.quantity;

    if (existing) {
      existing.items.push({ product, quantity: item.quantity, lineTotal });
      existing.subtotal += lineTotal;
    } else {
      groups.set(seller.id, {
        seller,
        items: [{ product, quantity: item.quantity, lineTotal }],
        subtotal: lineTotal,
        shipping: 0,
      });
    }
  }

  return Array.from(groups.values()).map((group) => {
    const quote = calculateShipping(zipCode, group.subtotal);
    return {
      ...group,
      shipping: quote.standardCost,
    };
  });
}

export function calculateCartTotals(groups: SellerCartGroup[]): {
  itemCount: number;
  subtotal: number;
  shippingTotal: number;
  grandTotal: number;
} {
  let itemCount = 0;
  let subtotal = 0;
  let shippingTotal = 0;

  for (const group of groups) {
    subtotal += group.subtotal;
    shippingTotal += group.shipping;
    for (const entry of group.items) {
      itemCount += entry.quantity;
    }
  }

  return {
    itemCount,
    subtotal,
    shippingTotal,
    grandTotal: subtotal + shippingTotal,
  };
}

export function filterVisibleProducts(
  products: Product[],
  sellers: SellerStore[],
  filters: CatalogFilters
): Product[] {
  const activeSellerIds = new Set(
    sellers.filter((s) => s.status === 'active').map((s) => s.id)
  );

  const query = filters.search.trim().toLowerCase();

  const filtered = products.filter((p) => {
    if (!activeSellerIds.has(p.sellerId)) return false;

    if (filters.category && filters.category !== 'Todas') {
      if (p.category !== filters.category) return false;
    }

    if (filters.condition !== 'all' && p.condition !== filters.condition) {
      return false;
    }

    if (filters.brand && filters.brand !== 'Todas') {
      if (p.brand !== filters.brand) return false;
    }

    if (filters.minPrice !== null && p.price < filters.minPrice) {
      return false;
    }

    if (filters.maxPrice !== null && p.price > filters.maxPrice) {
      return false;
    }

    if (query) {
      const seller = sellers.find((s) => s.id === p.sellerId);
      const haystack = [
        p.title,
        p.brand,
        p.category,
        p.specs.processor ?? '',
        p.specs.storage ?? '',
        p.specs.ram ?? '',
        seller?.name ?? '',
      ]
        .join(' ')
        .toLowerCase();

      if (!haystack.includes(query)) return false;
    }

    return true;
  });

  const sorted = [...filtered];
  switch (filters.sortBy) {
    case 'price_asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'best_selling':
      sorted.sort((a, b) => b.soldCount - a.soldCount);
      break;
    case 'rating':
      sorted.sort((a, b) => b.rating - a.rating);
      break;
    case 'featured':
    default:
      sorted.sort((a, b) => {
        const aScore = (a.isFlashDeal ? 2 : 0) + (a.isBestSeller ? 1 : 0);
        const bScore = (b.isFlashDeal ? 2 : 0) + (b.isBestSeller ? 1 : 0);
        if (bScore !== aScore) return bScore - aScore;
        return b.soldCount - a.soldCount;
      });
      break;
  }

  return sorted;
}

export interface SellerAnalytics {
  monthlySales: number;
  commissionDeducted: number;
  availableBalance: number;
  pendingOrdersCount: number;
  totalOrdersCount: number;
  itemsSold: number;
}

export function calculateSellerAnalytics(
  sellerId: string,
  orders: Order[],
  currentCommissionRate: number
): SellerAnalytics {
  let monthlySales = 0;
  let pendingOrdersCount = 0;
  let totalOrdersCount = 0;
  let itemsSold = 0;

  for (const order of orders) {
    for (const fulfillment of order.fulfillments) {
      if (fulfillment.sellerId !== sellerId) continue;
      totalOrdersCount += 1;
      monthlySales += fulfillment.subtotal;
      if (fulfillment.status !== 'Entregue') {
        pendingOrdersCount += 1;
      }
      for (const item of fulfillment.items) {
        itemsSold += item.quantity;
      }
    }
  }

  const commissionDeducted = monthlySales * (currentCommissionRate / 100);
  const availableBalance = Math.max(0, monthlySales - commissionDeducted);

  return {
    monthlySales,
    commissionDeducted,
    availableBalance,
    pendingOrdersCount,
    totalOrdersCount,
    itemsSold,
  };
}

export interface PlatformAnalytics {
  gmv: number;
  commissionRevenue: number;
  activeSellersCount: number;
  pendingSellersCount: number;
  suspendedSellersCount: number;
  totalOrdersCount: number;
}

export function calculatePlatformAnalytics(
  orders: Order[],
  sellers: SellerStore[],
  commissionRate: number
): PlatformAnalytics {
  const gmv = orders.reduce((acc, order) => acc + order.subtotal, 0);
  const commissionRevenue = gmv * (commissionRate / 100);

  let activeSellersCount = 0;
  let pendingSellersCount = 0;
  let suspendedSellersCount = 0;

  for (const seller of sellers) {
    if (seller.status === 'active') activeSellersCount += 1;
    else if (seller.status === 'pending') pendingSellersCount += 1;
    else if (seller.status === 'suspended') suspendedSellersCount += 1;
  }

  return {
    gmv,
    commissionRevenue,
    activeSellersCount,
    pendingSellersCount,
    suspendedSellersCount,
    totalOrdersCount: orders.length,
  };
}

export interface ProductFormInput {
  title: string;
  brand: string;
  category: string;
  condition: ProductCondition;
  price: number;
  stock: number;
  description: string;
}

export function validateProductForm(input: ProductFormInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.title.trim() || input.title.trim().length < 4) {
    errors.title = 'Informe um título com pelo menos 4 caracteres.';
  }
  if (!input.brand.trim()) {
    errors.brand = 'Informe a marca do produto.';
  }
  if (!input.category.trim()) {
    errors.category = 'Selecione uma categoria.';
  }
  if (!Number.isFinite(input.price) || input.price <= 0) {
    errors.price = 'Informe um preço válido maior que zero.';
  }
  if (!Number.isFinite(input.stock) || input.stock < 0) {
    errors.stock = 'Informe uma quantidade em estoque válida.';
  }
  if (!input.description.trim() || input.description.trim().length < 10) {
    errors.description = 'Adicione uma descrição técnica com pelo menos 10 caracteres.';
  }
  return errors;
}

export interface RegistrationInput {
  name: string;
  email: string;
  password: string;
  isSeller: boolean;
  storeName?: string;
  documentId?: string;
  mainCategory?: string;
}

export function validateRegistration(input: RegistrationInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.name.trim() || input.name.trim().length < 2) {
    errors.name = 'Informe seu nome completo.';
  }
  if (!input.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    errors.email = 'Informe um e-mail válido.';
  }
  if (!input.password || input.password.length < 6) {
    errors.password = 'A senha deve conter no mínimo 6 caracteres.';
  }
  if (input.isSeller) {
    if (!input.storeName?.trim() || input.storeName.trim().length < 3) {
      errors.storeName = 'Informe o nome da sua loja (mínimo 3 caracteres).';
    }
    if (!input.documentId?.trim() || input.documentId.trim().length < 8) {
      errors.documentId = 'Informe um NUIT / NIF válido.';
    }
    if (!input.mainCategory?.trim()) {
      errors.mainCategory = 'Selecione a categoria principal da loja.';
    }
  }
  return errors;
}
