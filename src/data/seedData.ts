import type { Address, Coupon, Order, Product, SellerStore, User } from '../types.ts';

export const ACTIVE_COUPONS: Coupon[] = [];

export const ASSET_IMAGES = {
  hero: '/src/assets/images/hero_tech_showcase_1795166103102.jpg',
  iphone16Pro: '/src/assets/images/prod_iphone_16_pro_1795166103038.jpg',
  galaxyS24Ultra: '/src/assets/images/prod_galaxy_s24_ultra_1795166101150.jpg',
  macbookPro: '/src/assets/images/prod_macbook_pro_m3_1795166101551.jpg',
  dellXps: '/src/assets/images/prod_dell_xps_15_1795166103581.jpg',
  ipadPro: '/src/assets/images/prod_ipad_pro_1795166101806.jpg',
  sonyHeadphones: '/src/assets/images/prod_sony_headphones_1795166102052.jpg',
  ganCharger: '/src/assets/images/prod_gan_charger_1795166102583.jpg',
  gamingHandheld: '/src/assets/images/prod_gaming_handheld_1795166102749.jpg',
} as const;

export const CUTOUT_IMAGES = {
  heroSmartphones: '/src/assets/images/cutouts/hero-smartphones.png',
  heroLaptop: '/src/assets/images/cutouts/hero-laptop.png',
  heroGamingAudio: '/src/assets/images/cutouts/hero-gaming-audio.png',
  iphone16Pro: '/src/assets/images/cutouts/iphone16.png',
  galaxyS24Ultra: '/src/assets/images/cutouts/galaxys24.png',
  macbookPro: '/src/assets/images/cutouts/hero-laptop.png',
  dellXps: '/src/assets/images/cutouts/dellxps.png',
  ipadPro: '/src/assets/images/cutouts/ipad.png',
  sonyHeadphones: '/src/assets/images/cutouts/headphones.png',
  ganCharger: '/src/assets/images/cutouts/gancharger.png',
  gamingHandheld: '/src/assets/images/cutouts/handheld.png',
} as const;

export const IMAGE_PRESET_OPTIONS = [
  { label: 'Smartphone Titânio', url: ASSET_IMAGES.iphone16Pro },
  { label: 'Smartphone Stylus', url: ASSET_IMAGES.galaxyS24Ultra },
  { label: 'Laptop Space Black', url: ASSET_IMAGES.macbookPro },
  { label: 'Ultrabook Prata', url: ASSET_IMAGES.dellXps },
  { label: 'Tablet Pro + Caneta', url: ASSET_IMAGES.ipadPro },
  { label: 'Headphone Studio ANC', url: ASSET_IMAGES.sonyHeadphones },
  { label: 'Carregador GaN 140W', url: ASSET_IMAGES.ganCharger },
  { label: 'Console Portátil Gaming', url: ASSET_IMAGES.gamingHandheld },
];

export const INITIAL_CATEGORIES: string[] = [
  'Smartphones',
  'Laptops',
  'Tablets',
  'Áudio',
  'Carregadores/Cabos',
  'Peças',
  'Gaming',
];

export const INITIAL_USERS: User[] = [];

export const INITIAL_ADDRESSES: Address[] = [];

export const INITIAL_SELLERS: SellerStore[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_ORDERS: Order[] = [];
