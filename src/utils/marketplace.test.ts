import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartTotals,
  calculateCouponDiscount,
  calculatePlatformAnalytics,
  calculateSellerAnalytics,
  calculateShipping,
  evaluatePasswordStrength,
  filterVisibleProducts,
  formatCurrency,
  getNextOrderStatus,
  getProductDiscountPercent,
  groupCartBySeller,
  validateProductForm,
  validateRegistration,
} from './marketplace';
import { ACTIVE_COUPONS } from '../data/seedData';
import type { Order, Product, SellerStore } from '../types';

const mockSellers: SellerStore[] = [
  {
    id: 'seller-a',
    ownerUserId: 'u-a',
    name: 'TechZone Store',
    slug: 'techzone',
    documentId: '12.345.678/0001-90',
    mainCategory: 'Laptops',
    description: 'Especialista em laptops',
    logoText: 'TZ',
    accentColor: '#2563EB',
    bannerImage: '',
    status: 'active',
    verified: true,
    rating: 4.9,
    reviewCount: 120,
    joinedDate: '2023-01-10',
    tenureLabel: '3 anos na Cellbox',
    location: 'São Paulo, SP',
    payoutInfo: {
      bankName: 'Banco Inter',
      accountType: 'Conta PJ',
      accountNumber: '0001 / 123456-7',
      pixOrWallet: 'financeiro@techzone.com',
    },
  },
  {
    id: 'seller-b',
    ownerUserId: 'u-b',
    name: 'MobileMaster',
    slug: 'mobilemaster',
    documentId: '98.765.432/0001-10',
    mainCategory: 'Smartphones',
    description: 'Smartphones oficiais',
    logoText: 'MM',
    accentColor: '#0F172A',
    bannerImage: '',
    status: 'active',
    verified: true,
    rating: 4.8,
    reviewCount: 95,
    joinedDate: '2024-02-15',
    tenureLabel: '2 anos na Cellbox',
    location: 'Curitiba, PR',
    payoutInfo: {
      bankName: 'Itaú',
      accountType: 'Conta PJ',
      accountNumber: '1234 / 55566-1',
      pixOrWallet: 'pix@mobilemaster.com',
    },
  },
  {
    id: 'seller-c',
    ownerUserId: 'u-c',
    name: 'GadgetHub',
    slug: 'gadgethub',
    documentId: '45.123.789/0001-55',
    mainCategory: 'Áudio',
    description: 'Acessórios premium',
    logoText: 'GH',
    accentColor: '#10B981',
    bannerImage: '',
    status: 'pending',
    verified: false,
    rating: 4.7,
    reviewCount: 12,
    joinedDate: '2026-11-01',
    tenureLabel: 'Recém-chegada',
    location: 'Belo Horizonte, MG',
    payoutInfo: {
      bankName: 'Nubank PJ',
      accountType: 'Conta PJ',
      accountNumber: '0001 / 998877-2',
      pixOrWallet: 'contato@gadgethub.com',
    },
  },
];

const mockProducts: Product[] = [
  {
    id: 'p-1',
    sellerId: 'seller-a',
    title: 'MacBook Pro 14 M3',
    brand: 'Apple',
    category: 'Laptops',
    condition: 'Novo',
    price: 14000,
    stock: 5,
    rating: 4.9,
    reviewCount: 40,
    soldCount: 80,
    images: [],
    description: 'Notebook profissional com chip M3.',
    specs: { ram: '18GB', storage: '512GB SSD', processor: 'M3 Pro', warranty: '12 meses' },
    createdAt: '2026-01-01',
  },
  {
    id: 'p-2',
    sellerId: 'seller-b',
    title: 'iPhone 16 Pro Max',
    brand: 'Apple',
    category: 'Smartphones',
    condition: 'Novo',
    price: 8999,
    stock: 10,
    rating: 4.9,
    reviewCount: 65,
    soldCount: 150,
    images: [],
    description: 'Smartphone topo de linha em titânio.',
    specs: { ram: '8GB', storage: '256GB', processor: 'A18 Pro', warranty: '12 meses' },
    createdAt: '2026-01-05',
  },
  {
    id: 'p-3',
    sellerId: 'seller-c',
    title: 'Sony WH-1000XM5',
    brand: 'Sony',
    category: 'Áudio',
    condition: 'Novo',
    price: 1200,
    stock: 8,
    rating: 4.8,
    reviewCount: 22,
    soldCount: 30,
    images: [],
    description: 'Headphone com cancelamento ativo de ruído.',
    specs: { battery: '30h', warranty: '12 meses' },
    createdAt: '2026-02-01',
  },
];

test('filterVisibleProducts excludes products from pending or suspended stores', () => {
  const visible = filterVisibleProducts(mockProducts, mockSellers, {
    search: '',
    category: 'Todas',
    condition: 'all',
    brand: 'Todas',
    minPrice: null,
    maxPrice: null,
    sortBy: 'featured',
  });
  assert.equal(visible.length, 2);
  assert.equal(visible.some((p) => p.sellerId === 'seller-c'), false);

  // Once seller-c is approved, its products appear immediately
  const approvedSellers = mockSellers.map((s) =>
    s.id === 'seller-c' ? { ...s, status: 'active' as const } : s
  );
  const visibleAfterApproval = filterVisibleProducts(mockProducts, approvedSellers, {
    search: '',
    category: 'Todas',
    condition: 'all',
    brand: 'Todas',
    minPrice: null,
    maxPrice: null,
    sortBy: 'featured',
  });
  assert.equal(visibleAfterApproval.length, 3);
  assert.equal(visibleAfterApproval.some((p) => p.id === 'p-3'), true);
});

test('formatCurrency formats values in Mozambican Metical (MT)', () => {
  const formatted = formatCurrency(98500);
  assert.ok(formatted.endsWith(' MT'));
  assert.ok(formatted.includes('98'));
  assert.ok(formatted.includes('500'));
});

test('groupCartBySeller supports multi-vendor cart and free shipping threshold', () => {
  const groups = groupCartBySeller(
    [
      { productId: 'p-1', quantity: 2 },
      { productId: 'p-2', quantity: 2 },
    ],
    mockProducts,
    mockSellers,
    '1100'
  );
  assert.equal(groups.length, 2);
  const totals = calculateCartTotals(groups);
  assert.equal(totals.itemCount, 4);
  assert.equal(totals.subtotal, 14000 * 2 + 8999 * 2);
  assert.equal(totals.shippingTotal, 0); // Both subtotals exceed 15.000 MT
  assert.equal(totals.grandTotal, totals.subtotal);
});

test('calculateShipping charges standard shipping below threshold', () => {
  const lowOrder = calculateShipping('1100', 4500);
  assert.equal(lowOrder.isFreeStandard, false);
  assert.equal(lowOrder.standardCost, 250);

  const highOrder = calculateShipping('3100', 20000);
  assert.equal(highOrder.isFreeStandard, true);
  assert.equal(highOrder.standardCost, 0);
});

test('getNextOrderStatus progresses strictly through fulfillment pipeline', () => {
  assert.equal(getNextOrderStatus('Pago'), 'Em Separação');
  assert.equal(getNextOrderStatus('Em Separação'), 'Enviado');
  assert.equal(getNextOrderStatus('Enviado'), 'Entregue');
  assert.equal(getNextOrderStatus('Entregue'), null);
});

test('platform and seller analytics calculate GMV, commissions, and net balance accurately', () => {
  const orders: Order[] = [
    {
      id: 'ORD-1',
      buyerId: 'u-buyer',
      buyerName: 'Mariana',
      buyerEmail: 'mariana@cellbox.com',
      createdAt: '2026-11-10',
      shippingAddress: {
        id: 'a-1',
        label: 'Casa',
        recipient: 'Mariana',
        street: 'Av Paulista, 1000',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
      },
      paymentMethod: 'pix_mobile',
      commissionRateSnapshot: 10,
      subtotal: 10000,
      shippingTotal: 0,
      total: 10000,
      fulfillments: [
        {
          sellerId: 'seller-a',
          sellerName: 'TechZone Store',
          items: [
            {
              productId: 'p-1',
              sellerId: 'seller-a',
              title: 'MacBook Pro 14 M3',
              image: '',
              price: 6000,
              quantity: 1,
              condition: 'Novo',
            },
          ],
          subtotal: 6000,
          shipping: 0,
          status: 'Pago',
          trackingCode: 'CBX-001',
          updatedAt: '2026-11-10',
        },
        {
          sellerId: 'seller-b',
          sellerName: 'MobileMaster',
          items: [
            {
              productId: 'p-2',
              sellerId: 'seller-b',
              title: 'iPhone 16 Pro Max',
              image: '',
              price: 4000,
              quantity: 1,
              condition: 'Novo',
            },
          ],
          subtotal: 4000,
          shipping: 0,
          status: 'Entregue',
          trackingCode: 'CBX-002',
          updatedAt: '2026-11-12',
        },
      ],
    },
  ];

  const platform10 = calculatePlatformAnalytics(orders, mockSellers, 10);
  assert.equal(platform10.gmv, 10000);
  assert.equal(platform10.commissionRevenue, 1000);
  assert.equal(platform10.activeSellersCount, 2);
  assert.equal(platform10.pendingSellersCount, 1);

  const platform15 = calculatePlatformAnalytics(orders, mockSellers, 15);
  assert.equal(platform15.commissionRevenue, 1500);

  const sellerAStats = calculateSellerAnalytics('seller-a', orders, 10);
  assert.equal(sellerAStats.monthlySales, 6000);
  assert.equal(sellerAStats.commissionDeducted, 600);
  assert.equal(sellerAStats.availableBalance, 5400);
  assert.equal(sellerAStats.pendingOrdersCount, 1);
});

test('form validations catch missing required inputs', () => {
  const productErrors = validateProductForm({
    title: 'AB',
    brand: '',
    category: '',
    condition: 'Novo',
    price: 0,
    stock: -1,
    description: 'curta',
  });
  assert.ok(productErrors.title);
  assert.ok(productErrors.brand);
  assert.ok(productErrors.price);
  assert.ok(productErrors.stock);

  const sellerRegErrors = validateRegistration({
    name: 'João',
    email: 'invalid-email',
    password: '123',
    isSeller: true,
    storeName: '',
    documentId: '123',
    mainCategory: '',
  });
  assert.ok(sellerRegErrors.email);
  assert.ok(sellerRegErrors.password);
  assert.ok(sellerRegErrors.storeName);
  assert.ok(sellerRegErrors.documentId);
  assert.ok(sellerRegErrors.mainCategory);
});

test('getProductDiscountPercent and calculateCouponDiscount compute savings accurately', () => {
  assert.equal(getProductDiscountPercent({ price: 58900, originalPrice: 74900 }), 21);
  assert.equal(getProductDiscountPercent({ price: 21500 }), 0);

  const pctOk = calculateCouponDiscount('cellbox10', ACTIVE_COUPONS, 20000);
  assert.equal(pctOk.discount, 2000);
  assert.equal(pctOk.error, undefined);

  const belowMin = calculateCouponDiscount('TECH2500', ACTIVE_COUPONS, 20000);
  assert.equal(belowMin.discount, 0);
  assert.ok(belowMin.error);

  const invalid = calculateCouponDiscount('INVALIDO', ACTIVE_COUPONS, 50000);
  assert.equal(invalid.discount, 0);
  assert.ok(invalid.error);
});

test('evaluatePasswordStrength scores passwords accurately from weak to strong', () => {
  assert.equal(evaluatePasswordStrength('').score, 0);
  assert.equal(evaluatePasswordStrength('abc').score, 1);
  assert.equal(evaluatePasswordStrength('abcdef').score, 1);
  assert.equal(evaluatePasswordStrength('Abcdef12').score, 3);
  assert.equal(evaluatePasswordStrength('Cellbox@2026!').score, 4);
  assert.equal(evaluatePasswordStrength('Cellbox@2026!').label, 'Forte');
});

test('validateRegistration allows seller registration with phone and optional documentId', () => {
  const okErrors = validateRegistration({
    name: 'Amélia Cossa',
    email: 'amelia@lojamz.co.mz',
    password: 'StrongPassword1!',
    phone: '+258 84 123 4567',
    isSeller: true,
    storeName: 'Maputo Tech Hub',
    mainCategory: 'Smartphones',
  });
  assert.deepEqual(okErrors, {});

  const badPhoneErrors = validateRegistration({
    name: 'Amélia Cossa',
    email: 'amelia@lojamz.co.mz',
    password: 'StrongPassword1!',
    phone: '123',
    isSeller: false,
  });
  assert.ok(badPhoneErrors.phone);
});
