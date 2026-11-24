import type { SiteCustomization } from '../types.ts';
import { CUTOUT_IMAGES } from './seedData.ts';

export const DEFAULT_SITE_CUSTOMIZATION: SiteCustomization = {
  header: {
    topBarNotice: 'Atendimento exclusivo Moçambique · Entregas seguras em todas as províncias',
    phone: '+258 84 400 2026',
    email: 'suporte@cellbox.co.mz',
    currencyLabel: 'MZ | MZN (MT)',
  },
  heroSlides: [
    {
      id: 'slide-1',
      kicker: 'Lançamento Oficial',
      title: 'iPhone 16 Pro & Tech 2026',
      subtitle: 'Smartphones e acessórios de lojas verificadas com entrega em todo Moçambique.',
      highlight: 'A partir de 98.500 MT · Garantia oficial de 12 meses',
      ctaText: 'VER OFERTA',
      imageUrl: CUTOUT_IMAGES.heroSmartphones,
    },
    {
      id: 'slide-2',
      kicker: 'Estação Pro',
      title: 'Laptops M3 Pro & OLED',
      subtitle: 'Performance profissional para trabalho criativo com frete grátis acima de 15.000 MT.',
      highlight: 'A partir de 129.900 MT · Envio segurado',
      ctaText: 'CONFERIR LAPTOPS',
      imageUrl: CUTOUT_IMAGES.heroLaptop,
    },
    {
      id: 'slide-3',
      kicker: 'Gaming & Áudio',
      title: 'Consoles & Fones ANC',
      subtitle: 'Desempenho portátil com ROG Ally X e cancelamento de ruído de estúdio.',
      highlight: 'A partir de 21.500 MT · Envio imediato',
      ctaText: 'EXPLORAR GAMING',
      imageUrl: CUTOUT_IMAGES.heroGamingAudio,
    },
  ],
  subBanners: [
    {
      id: 'sub-1',
      title: 'NOVOS TABLETS!',
      subtitle: 'Até 20% OFF em iPad Pro',
      ctaText: 'VER AGORA',
      imageUrl: CUTOUT_IMAGES.ipadPro,
    },
    {
      id: 'sub-2',
      title: 'OFERTA LAPTOPS',
      subtitle: 'Workstations MacBook Pro M3 e Dell XPS OLED com garantia oficial e entrega grátis.',
      ctaText: 'COMPRAR AGORA',
      imageUrl: CUTOUT_IMAGES.macbookPro,
    },
  ],
  wideBanner: {
    title: 'ECONOMIZE ATÉ 16.500 MT!',
    kicker: 'EM SMARTPHONES RECONDICIONADOS A+ E NOTEBOOKS PRO',
    description: 'Aparelhos revisados em laboratório com garantia oficial Cellbox de 12 meses e envio imediato em todo o país.',
    ctaText: 'VER SEMINOVOS A+',
    imageUrl: CUTOUT_IMAGES.dellXps,
  },
  partnerBrands: [
    { id: 'brand-1', name: 'Apple' },
    { id: 'brand-2', name: 'Samsung' },
    { id: 'brand-3', name: 'Dell' },
    { id: 'brand-4', name: 'Sony' },
    { id: 'brand-5', name: 'ASUS' },
    { id: 'brand-6', name: 'Anker' },
  ],
  contact: {
    phone1: '+258 84 400 2026',
    phone2: '+258 82 387 4321',
    emailSupport: 'suporte@cellbox.co.mz',
    emailPartners: 'parcerias@cellbox.co.mz',
    address: 'Av. 25 de Setembro, 1234 — Maputo, Moçambique',
    whatsapp: '+258 84 400 2026',
    socials: {
      facebook: 'https://facebook.com/cellbox',
      instagram: 'https://instagram.com/cellbox.mz',
      twitter: 'https://x.com/cellbox',
      youtube: 'https://youtube.com/@cellbox',
      tiktok: '',
    },
  },
  footer: {
    aboutText: 'A Cellbox conecta consumidores em todo Moçambique às melhores lojas oficiais de smartphones, laptops, tablets, áudio e acessórios com garantia e suporte nacional.',
    guaranteeText: 'Compra 100% Garantida com devolução facilitada em até 30 dias e assistência técnica autorizada.',
    copyrightText: 'Copyright © 2026 Cellbox Moçambique. Todos os direitos reservados. Preços em Meticais (MZN).',
  },
  gateways: {
    escalePayCheckoutUrl: '',
    escalePayWebhookSecret: '',
  },
};
