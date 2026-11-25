import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Package,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Star,
  Store,
  Trash2,
  Upload,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { MOZAMBIQUE_PROVINCES, type PayoutMethod, type ProductCondition } from '../types';
import {
  calculateSellerAnalytics,
  formatCurrency,
  formatSellerPayoutSummary,
  getNextOrderStatus,
  isStorePubliclyActive,
  validateProductForm,
} from '../utils/marketplace';
import { MotionButton } from './MotionPrimitives';
import { ProductImage } from './ProductImage';

interface SellerDashboardViewProps {
  initialTab?: 'overview' | 'products' | 'orders' | 'finance' | 'settings';
}

interface DynamicSpecItem {
  id: string;
  key: string;
  value: string;
}

interface CsvParsedItem {
  rowNum: number;
  title: string;
  category: string;
  subcategory?: string;
  brand: string;
  price: number;
  originalPrice?: number;
  stock: number;
  description: string;
  images: string[];
  specs: Record<string, string>;
  isValid: boolean;
  errors: string[];
}

export function SellerDashboardView({ initialTab = 'overview' }: SellerDashboardViewProps) {
  const {
    currentUser,
    sellers,
    products,
    categories,
    orders,
    payouts,
    commissionRate,
    createProduct,
    updateProduct,
    deleteProduct,
    updateOrderFulfillmentStatus,
    updateSellerSettings,
    requestSellerPayout,
    importProductsFromCsv,
    updateProfile,
    uploadImageAsset,
    submitSellerKyc,
    paySellerActivationFee,
    siteCustomization,
    navigate,
    showToast,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'finance' | 'settings'>(
    initialTab
  );
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const seller =
    sellers.find((s) => currentUser?.sellerId && s.id === currentUser.sellerId) ??
    sellers.find((s) => currentUser && s.ownerUserId === currentUser.id);

  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('Todas');
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');

  // Activation, KYC & Fee Payment State
  const [kycDocType, setKycDocType] = useState<'BI' | 'NUIT' | 'Passaporte' | 'Alvara'>('BI');
  const [kycDocNumber, setKycDocNumber] = useState(seller?.documentId ?? '');
  const [kycFullName, setKycFullName] = useState(currentUser?.name ?? '');
  const [kycDocFrontUrl, setKycDocFrontUrl] = useState('');
  const [kycDocBackUrl, setKycDocBackUrl] = useState('');
  const [uploadingKycDoc, setUploadingKycDoc] = useState(false);
  const [uploadingKycDocBack, setUploadingKycDocBack] = useState(false);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [kycModalOpen, setKycModalOpen] = useState(false);

  const [feeMethod, setFeeMethod] = useState<'mpesa' | 'emola'>('mpesa');
  const [feePhone, setFeePhone] = useState(currentUser?.phone ?? '');
  const [feeTransactionId, setFeeTransactionId] = useState('');
  const [feeProofUrl, setFeeProofUrl] = useState('');
  const [uploadingFeeProof, setUploadingFeeProof] = useState(false);
  const [payingFee, setPayingFee] = useState(false);
  const [feeModalOpen, setFeeModalOpen] = useState(false);

  useEffect(() => {
    if (seller) {
      setKycDocNumber((prev) => prev || seller.documentId || '');
      setFeeTransactionId((prev) => prev || seller.activation?.feeTransactionId || '');
      setFeeProofUrl((prev) => prev || seller.activation?.feeProofUrl || '');
    }
    if (currentUser) {
      setKycFullName((prev) => prev || currentUser.name || '');
      setFeePhone((prev) => prev || currentUser.phone || '');
    }
    if (typeof window !== 'undefined' && window.location.search.includes('payment=success')) {
      showToast('Pagamento detectado! Atualizando status da sua loja...', 'success');
    }
  }, [seller, currentUser, showToast]);

  const isPublicActive = seller ? isStorePubliclyActive(seller) : false;
  const profileDone = Boolean(
    seller?.activation?.profileCompleted ?? (seller?.name && seller?.mainCategory && seller?.location)
  );
  const kycDone = Boolean(
    seller?.activation?.kycCompleted || seller?.kyc?.status === 'verified'
  );
  const kycPending = seller?.kyc?.status === 'pending';
  const kycRejected = seller?.kyc?.status === 'rejected';

  const feeDone = Boolean(seller?.activation?.feePaid);
  const feePending = Boolean(!feeDone && (seller?.activation?.feeStatus === 'pending' || seller?.activation?.feeTransactionId));
  const feeRejected = Boolean(!feeDone && seller?.activation?.feeStatus === 'rejected');

  const completedStepsCount = (profileDone ? 1 : 0) + (kycDone ? 1 : 0) + (feeDone ? 1 : 0);
  const progressPercent = Math.round((completedStepsCount / 3) * 100);

  const handleUploadKycDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingKycDoc(true);
    try {
      const result = await uploadImageAsset(file, 'kyc');
      if (result.ok && result.url) {
        setKycDocFrontUrl(result.url);
      }
    } finally {
      setUploadingKycDoc(false);
    }
  };

  const handleUploadKycDocBack = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingKycDocBack(true);
    try {
      const result = await uploadImageAsset(file, 'kyc');
      if (result.ok && result.url) {
        setKycDocBackUrl(result.url);
      }
    } finally {
      setUploadingKycDocBack(false);
    }
  };

  const handleUploadFeeProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingFeeProof(true);
    try {
      const result = await uploadImageAsset(file, 'proofs');
      if (result.ok && result.url) {
        setFeeProofUrl(result.url);
      }
    } finally {
      setUploadingFeeProof(false);
    }
  };

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller || !kycDocNumber.trim() || !kycFullName.trim()) return;
    setSubmittingKyc(true);
    try {
      const ok = await submitSellerKyc(seller.id, {
        documentType: kycDocType,
        documentNumber: kycDocNumber.trim(),
        fullName: kycFullName.trim(),
        documentFrontUrl: kycDocFrontUrl || undefined,
        documentBackUrl: kycDocBackUrl || undefined,
      });
      if (ok) {
        setKycModalOpen(false);
      }
    } finally {
      setSubmittingKyc(false);
    }
  };

  const handlePayFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller || !feePhone.trim() || !feeTransactionId.trim()) return;
    setPayingFee(true);
    try {
      const ok = await paySellerActivationFee(seller.id, {
        method: feeMethod,
        phone: feePhone.trim(),
        transactionId: feeTransactionId.trim(),
        proofUrl: feeProofUrl || undefined,
      });
      if (ok) {
        setFeeModalOpen(false);
      }
    } finally {
      setPayingFee(false);
    }
  };

  // Product Form State (Universal & Multi-category)
  const [formState, setFormState] = useState({
    title: '',
    category: categories[0] ?? 'Smartphones',
    subcategory: '',
    brand: '',
    condition: 'Novo' as ProductCondition,
    price: '',
    originalPrice: '',
    stock: '10',
    description: '',
    images: [] as string[],
  });
  const [dynamicSpecs, setDynamicSpecs] = useState<DynamicSpecItem[]>([
    { id: '1', key: '', value: '' },
  ]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [customImageUrlInput, setCustomImageUrlInput] = useState('');
  const [uploadingProductImages, setUploadingProductImages] = useState(false);

  // CSV Bulk Import State
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvParsedItems, setCsvParsedItems] = useState<CsvParsedItem[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);

  // Store settings form
  const [storeForm, setStoreForm] = useState({
    name: seller?.name ?? '',
    mainCategory: seller?.mainCategory ?? 'Smartphones',
    description: seller?.description ?? '',
    logoText: seller?.logoText ?? '',
    logoUrl: seller?.logoUrl ?? '',
    accentColor: seller?.accentColor ?? '#0475EE',
    location: seller?.location ?? '',
    bannerImage: seller?.bannerImage ?? '',
    facebook: seller?.socials?.facebook ?? '',
    instagram: seller?.socials?.instagram ?? '',
    tiktok: seller?.socials?.tiktok ?? '',
    youtube: seller?.socials?.youtube ?? '',
    bankName: seller?.payoutInfo?.bankName ?? '',
    accountType: seller?.payoutInfo?.accountType ?? '',
    accountNumber: seller?.payoutInfo?.accountNumber ?? '',
    pixOrWallet: seller?.payoutInfo?.pixOrWallet ?? '',
    accountHolder: seller?.payoutInfo?.accountHolder ?? currentUser?.name ?? '',
    preferredMethod: (seller?.payoutInfo?.preferredMethod ?? 'mpesa') as PayoutMethod,
  });

  // Withdrawal / Payout Request Modal State (Modo A)
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('mpesa');
  const [payoutAccountHolder, setPayoutAccountHolder] = useState('');
  const [payoutWalletPhone, setPayoutWalletPhone] = useState('');
  const [payoutBankName, setPayoutBankName] = useState('');
  const [payoutAccountType, setPayoutAccountType] = useState('Conta Corrente');
  const [payoutAccountNumber, setPayoutAccountNumber] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [savePayoutDefaults, setSavePayoutDefaults] = useState(true);
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [payoutFormError, setPayoutFormError] = useState('');
  const [uploadingLogoImg, setUploadingLogoImg] = useState(false);
  const [uploadingBannerImg, setUploadingBannerImg] = useState(false);
  const [savingStoreSettings, setSavingStoreSettings] = useState(false);

  // Seller Personal Profile form state (Mirroring Registration Step 1)
  const [personalName, setPersonalName] = useState(currentUser?.name ?? '');
  const [personalPhone, setPersonalPhone] = useState(currentUser?.phone ?? '');
  const [personalAvatarUrl, setPersonalAvatarUrl] = useState(currentUser?.avatarUrl ?? '');
  const [personalProvince, setPersonalProvince] = useState(currentUser?.province ?? 'Maputo Cidade');
  const [personalCity, setPersonalCity] = useState(currentUser?.city ?? '');
  const [personalNeighborhood, setPersonalNeighborhood] = useState(currentUser?.neighborhood ?? '');
  const [personalZipCode, setPersonalZipCode] = useState(currentUser?.zipCode ?? '');
  const [uploadingPersonalAvatar, setUploadingPersonalAvatar] = useState(false);
  const [savingPersonalProfile, setSavingPersonalProfile] = useState(false);

  useEffect(() => {
    if (!seller) return;
    setStoreForm({
      name: seller.name,
      mainCategory: seller.mainCategory || 'Smartphones',
      description: seller.description || '',
      logoText: seller.logoText || '',
      logoUrl: seller.logoUrl || '',
      accentColor: seller.accentColor || '#0475EE',
      location: seller.location || '',
      bannerImage: seller.bannerImage || '',
      facebook: seller.socials?.facebook || '',
      instagram: seller.socials?.instagram || '',
      tiktok: seller.socials?.tiktok || '',
      youtube: seller.socials?.youtube || '',
      bankName: seller.payoutInfo?.bankName || '',
      accountType: seller.payoutInfo?.accountType || '',
      accountNumber: seller.payoutInfo?.accountNumber || '',
      pixOrWallet: seller.payoutInfo?.pixOrWallet || '',
      accountHolder: seller.payoutInfo?.accountHolder || currentUser?.name || '',
      preferredMethod: seller.payoutInfo?.preferredMethod || 'mpesa',
    });
  }, [seller]);

  useEffect(() => {
    if (!currentUser) return;
    setPersonalName(currentUser.name);
    setPersonalPhone(currentUser.phone ?? '');
    setPersonalAvatarUrl(currentUser.avatarUrl ?? '');
    setPersonalProvince(currentUser.province ?? 'Maputo Cidade');
    setPersonalCity(currentUser.city ?? '');
    setPersonalNeighborhood(currentUser.neighborhood ?? '');
    setPersonalZipCode(currentUser.zipCode ?? '');
  }, [currentUser]);

  // Product Image Management
  const handleProductImageFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    setUploadingProductImages(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          showToast(`O arquivo "${file.name}" excede 5 MB e foi ignorado.`, 'warning');
          continue;
        }
        const res = await uploadImageAsset(file, 'products');
        if (res.ok && res.url) {
          uploadedUrls.push(res.url);
        }
      }
      if (uploadedUrls.length > 0) {
        setFormState((prev) => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls],
        }));
        showToast(`${uploadedUrls.length} imagem(ns) adicionada(s) ao produto.`);
      }
    } finally {
      setUploadingProductImages(false);
    }
  };

  const handleAddCustomImageUrl = () => {
    const url = customImageUrlInput.trim();
    if (!url) return;
    setFormState((prev) => ({
      ...prev,
      images: [...prev.images, url],
    }));
    setCustomImageUrlInput('');
  };

  const handleRemoveProductImage = (idx: number) => {
    setFormState((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  const handleSetMainProductImage = (idx: number) => {
    setFormState((prev) => {
      const img = prev.images[idx];
      const rest = prev.images.filter((_, i) => i !== idx);
      return { ...prev, images: [img, ...rest] };
    });
  };

  // Dynamic Specs Management
  const handleAddDynamicSpec = () => {
    setDynamicSpecs((prev) => [
      ...prev,
      { id: String(Date.now() + Math.random()), key: '', value: '' },
    ]);
  };

  const handleRemoveDynamicSpec = (id: string) => {
    setDynamicSpecs((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateDynamicSpec = (id: string, field: 'key' | 'value', val: string) => {
    setDynamicSpecs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
  };

  // Universal Product Submission
  const handleCreateUniversalProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Number(formState.price);
    const numericStock = Number(formState.stock);

    const errors: Record<string, string> = {};
    if (!formState.title.trim() || formState.title.trim().length < 3) {
      errors.title = 'Informe um título com pelo menos 3 caracteres.';
    }
    if (!formState.category.trim()) {
      errors.category = 'Selecione uma categoria.';
    }
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      errors.price = 'Informe um preço válido maior que zero.';
    }
    if (!Number.isFinite(numericStock) || numericStock < 0) {
      errors.stock = 'Informe uma quantidade válida.';
    }
    if (!formState.description.trim() || formState.description.trim().length < 5) {
      errors.description = 'Adicione uma descrição detalhada.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (formState.images.length === 0) {
      showToast('Adicione pelo menos 1 imagem do produto.', 'warning');
      return;
    }

    setFormErrors({});

    const specsMap: Record<string, string> = {};
    for (const spec of dynamicSpecs) {
      if (spec.key.trim() && spec.value.trim()) {
        specsMap[spec.key.trim()] = spec.value.trim();
      }
    }

    if (!seller) return;
    const created = await createProduct({
      sellerId: seller.id,
      title: formState.title.trim(),
      brand: formState.brand.trim() || 'Genérica',
      category: formState.category.trim(),
      subcategory: formState.subcategory.trim() || undefined,
      condition: formState.condition,
      price: numericPrice,
      originalPrice: formState.originalPrice ? Number(formState.originalPrice) : undefined,
      stock: numericStock,
      description: formState.description.trim(),
      imageUrl: formState.images[0],
      images: formState.images,
      specs: specsMap,
    });

    if (created) {
      setNewProductOpen(false);
      setFormState({
        title: '',
        category: categories[0] ?? 'Smartphones',
        subcategory: '',
        brand: '',
        condition: 'Novo',
        price: '',
        originalPrice: '',
        stock: '10',
        description: '',
        images: [],
      });
      setDynamicSpecs([{ id: '1', key: '', value: '' }]);
      setActiveTab('products');
    }
  };

  // CSV Helpers
  const handleDownloadCsvTemplate = () => {
    const csvContent =
      'titulo,categoria,subcategoria,marca,preco,preco_promocional,estoque,descricao,imagem_url,especificacoes\n' +
      '"Samsung Galaxy S24 Ultra","Smartphones","Android","Samsung",75000,82000,10,"Aparelho novo com garantia oficial e caneta S-Pen.","https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80","Armazenamento: 256GB; RAM: 12GB; Cor: Titânio"\n' +
      '"Creme Facial Hidratante 200ml","Beleza & Cosméticos","Skincare","CeraVe",1450,1650,25,"Hidratação profunda para pele seca com ceramidas e ácido hialurônico.","https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80","Volume: 200ml; Tipo de Pele: Seca; Validade: 12/2026"\n' +
      '"Tênis Esportivo Casual","Moda & Calçados","Calçados","Nike",4900,5500,15,"Tênis confortável para caminhada e uso diário.","https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80","Tamanho: 42; Cor: Preto; Gênero: Unissex"\n';

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_produtos_cellbox.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseCsvRawLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((c === ',' || c === ';') && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const handleCsvFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const rawLines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (rawLines.length < 2) {
        showToast('O arquivo CSV deve conter um cabeçalho e pelo menos 1 linha de produto.', 'warning');
        return;
      }

      const headers = parseCsvRawLine(rawLines[0]).map((h) =>
        h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      );

      const findIdx = (names: string[]): number => {
        return headers.findIndex((h) => names.some((n) => h.includes(n)));
      };

      const titleIdx = findIdx(['titulo', 'nome', 'title', 'produto']);
      const catIdx = findIdx(['categoria', 'category']);
      const subcatIdx = findIdx(['subcategoria', 'subcat']);
      const brandIdx = findIdx(['marca', 'brand']);
      const priceIdx = findIdx(['preco', 'price', 'valor']);
      const origPriceIdx = findIdx(['promocional', 'original', 'de_preco']);
      const stockIdx = findIdx(['estoque', 'stock', 'qtd', 'quantidade']);
      const descIdx = findIdx(['descricao', 'description', 'detalhe']);
      const imgIdx = findIdx(['imagem', 'image', 'foto', 'url']);
      const specsIdx = findIdx(['especificacoes', 'especificacao', 'specs', 'variacoes']);

      const parsed: CsvParsedItem[] = [];

      for (let i = 1; i < rawLines.length; i++) {
        const cols = parseCsvRawLine(rawLines[i]);
        if (cols.length === 0 || cols.every((c) => !c)) continue;

        const title = (titleIdx >= 0 ? cols[titleIdx] : cols[0]) ?? '';
        const category = (catIdx >= 0 ? cols[catIdx] : cols[1]) ?? 'Geral';
        const subcategory = subcatIdx >= 0 ? cols[subcatIdx] : undefined;
        const brand = (brandIdx >= 0 ? cols[brandIdx] : cols[3]) || 'Genérica';
        const rawPrice = (priceIdx >= 0 ? cols[priceIdx] : cols[4]) ?? '';
        const rawOrigPrice = origPriceIdx >= 0 ? cols[origPriceIdx] : undefined;
        const rawStock = (stockIdx >= 0 ? cols[stockIdx] : cols[6]) ?? '10';
        const description = (descIdx >= 0 ? cols[descIdx] : cols[7]) || title;
        const rawImg = imgIdx >= 0 ? cols[imgIdx] : cols[8];
        const rawSpecs = specsIdx >= 0 ? cols[specsIdx] : cols[9];

        const price = Number(rawPrice.replace(/[^0-9.]/g, ''));
        const originalPrice = rawOrigPrice ? Number(rawOrigPrice.replace(/[^0-9.]/g, '')) : undefined;
        const stock = parseInt(rawStock.replace(/[^0-9]/g, ''), 10) || 0;

        const errors: string[] = [];
        if (!title || title.length < 3) errors.push('Título muito curto');
        if (!category) errors.push('Categoria ausente');
        if (!Number.isFinite(price) || price <= 0) errors.push('Preço inválido');
        if (Number.isNaN(stock) || stock < 0) errors.push('Estoque inválido');

        const specs: Record<string, string> = {};
        if (rawSpecs) {
          rawSpecs.split(';').forEach((part) => {
            const [k, ...v] = part.split(':');
            if (k && v.length) {
              specs[k.trim()] = v.join(':').trim();
            }
          });
        }

        const images = rawImg ? [rawImg.trim()] : [];

        parsed.push({
          rowNum: i,
          title,
          category,
          subcategory,
          brand,
          price,
          originalPrice,
          stock,
          description,
          images,
          specs,
          isValid: errors.length === 0,
          errors,
        });
      }

      setCsvParsedItems(parsed);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImportParsedCsv = async () => {
    const validItems = csvParsedItems.filter((it) => it.isValid);
    if (validItems.length === 0) {
      showToast('Nenhum item válido para importar.', 'warning');
      return;
    }

    setCsvImporting(true);
    try {
      const itemsPayload = validItems.map((it) => ({
        title: it.title,
        brand: it.brand,
        category: it.category,
        subcategory: it.subcategory,
        condition: 'Novo' as const,
        price: it.price,
        originalPrice: it.originalPrice,
        stock: it.stock,
        description: it.description,
        images: it.images,
        specs: it.specs,
      }));

      const res = await importProductsFromCsv(itemsPayload);
      if (res.ok) {
        setCsvModalOpen(false);
        setCsvFileName('');
        setCsvParsedItems([]);
        setActiveTab('products');
      }
    } finally {
      setCsvImporting(false);
    }
  };

  // Upload Handlers with Strict 5MB Validation
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('O arquivo de logotipo excede o limite máximo de 5 MB.', 'warning');
      return;
    }
    setUploadingLogoImg(true);
    try {
      const result = await uploadImageAsset(file, 'logos');
      if (result.ok && result.url) {
        setStoreForm((p) => ({ ...p, logoUrl: result.url! }));
        showToast('Logotipo enviado com sucesso!');
      }
    } finally {
      setUploadingLogoImg(false);
    }
  };

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('A capa/banner excede o limite máximo de 5 MB.', 'warning');
      return;
    }
    setUploadingBannerImg(true);
    try {
      const result = await uploadImageAsset(file, 'banners');
      if (result.ok && result.url) {
        setStoreForm((p) => ({ ...p, bannerImage: result.url! }));
        showToast('Capa da loja enviada com sucesso!');
      }
    } finally {
      setUploadingBannerImg(false);
    }
  };

  const handlePersonalAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('A foto de perfil excede o limite máximo de 5 MB.', 'warning');
      return;
    }
    setUploadingPersonalAvatar(true);
    try {
      const result = await uploadImageAsset(file, 'avatars');
      if (result.ok && result.url && currentUser) {
        setPersonalAvatarUrl(result.url);
        await updateProfile({
          name: personalName || currentUser.name,
          phone: personalPhone || (currentUser.phone ?? ''),
          avatarUrl: result.url,
          province: personalProvince,
          city: personalCity,
          neighborhood: personalNeighborhood,
          zipCode: personalZipCode,
        });
      }
    } finally {
      setUploadingPersonalAvatar(false);
    }
  };

  // Settings Save Handlers
  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller) return;
    setSavingStoreSettings(true);
    try {
      await updateSellerSettings(seller.id, {
        name: storeForm.name.trim() || seller.name,
        mainCategory: storeForm.mainCategory.trim() || 'Smartphones',
        description: storeForm.description.trim(),
        logoText: storeForm.logoText.trim().slice(0, 3).toUpperCase() || seller.logoText,
        logoUrl: storeForm.logoUrl.trim() || undefined,
        accentColor: storeForm.accentColor,
        location: storeForm.location.trim(),
        bannerImage: storeForm.bannerImage.trim(),
        socials: {
          facebook: storeForm.facebook.trim() || undefined,
          instagram: storeForm.instagram.trim() || undefined,
          tiktok: storeForm.tiktok.trim() || undefined,
          youtube: storeForm.youtube.trim() || undefined,
        },
        payoutInfo: {
          bankName: storeForm.bankName.trim(),
          accountType: storeForm.accountType.trim(),
          accountNumber: storeForm.accountNumber.trim(),
          pixOrWallet: storeForm.pixOrWallet.trim(),
          accountHolder: storeForm.accountHolder.trim() || undefined,
          preferredMethod: storeForm.preferredMethod,
        },
      });
    } finally {
      setSavingStoreSettings(false);
    }
  };

  const handleSavePersonalProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSavingPersonalProfile(true);
    try {
      await updateProfile({
        name: personalName.trim() || currentUser.name,
        phone: personalPhone.trim(),
        avatarUrl: personalAvatarUrl || undefined,
        province: personalProvince,
        city: personalCity.trim(),
        neighborhood: personalNeighborhood.trim(),
        zipCode: personalZipCode.trim(),
      });
    } finally {
      setSavingPersonalProfile(false);
    }
  };

  const sellerProducts = useMemo(() => {
    if (!seller) return [];
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (p.sellerId !== seller.id) return false;
      if (productCategoryFilter !== 'Todas' && p.category !== productCategoryFilter) return false;
      if (q && !p.title.toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [products, seller, productSearch, productCategoryFilter]);

  const sellerOrders = useMemo(() => {
    if (!seller) return [];
    const list: Array<{
      orderId: string;
      buyerName: string;
      buyerEmail: string;
      createdAt: string;
      city: string;
      fulfillment: (typeof orders)[0]['fulfillments'][0];
    }> = [];
    for (const order of orders) {
      const f = order.fulfillments.find((entry) => entry.sellerId === seller.id);
      if (f) {
        list.push({
          orderId: order.id,
          buyerName: order.buyerName,
          buyerEmail: order.buyerEmail,
          createdAt: order.createdAt,
          city: `${order.shippingAddress.city} - ${order.shippingAddress.state}`,
          fulfillment: f,
        });
      }
    }
    return list;
  }, [orders, seller]);

  const sellerPayouts = useMemo(() => {
    if (!seller) return [];
    return payouts.filter((p) => p.sellerId === seller.id);
  }, [payouts, seller]);

  const analytics = useMemo(
    () =>
      seller
        ? calculateSellerAnalytics(seller.id, orders, commissionRate, payouts)
        : {
            monthlySales: 0,
            commissionDeducted: 0,
            deliveredGross: 0,
            deliveredCommission: 0,
            deliveredNet: 0,
            deliveredOrdersCount: 0,
            escrowGross: 0,
            escrowNet: 0,
            paidPayoutsTotal: 0,
            pendingPayoutsTotal: 0,
            availableBalance: 0,
            pendingOrdersCount: 0,
            totalOrdersCount: 0,
            itemsSold: 0,
          },
    [seller, orders, commissionRate, payouts]
  );

  const openPayoutModal = () => {
    setPayoutFormError('');
    setPayoutAmount(analytics.availableBalance > 0 ? analytics.availableBalance.toFixed(2) : '');
    setPayoutMethod(seller?.payoutInfo?.preferredMethod ?? 'mpesa');
    setPayoutAccountHolder(seller?.payoutInfo?.accountHolder || currentUser?.name || '');
    setPayoutWalletPhone(seller?.payoutInfo?.pixOrWallet || currentUser?.phone || '');
    setPayoutBankName(seller?.payoutInfo?.bankName || '');
    setPayoutAccountType(seller?.payoutInfo?.accountType || 'Conta Corrente');
    setPayoutAccountNumber(seller?.payoutInfo?.accountNumber || '');
    setPayoutNotes('');
    setSavePayoutDefaults(true);
    setPayoutModalOpen(true);
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutFormError('');
    const numAmount = Number(payoutAmount.replace(',', '.'));
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setPayoutFormError('Informe um valor válido maior que zero.');
      return;
    }
    if (numAmount > analytics.availableBalance + 0.01) {
      setPayoutFormError('O valor solicitado excede o saldo disponível para saque.');
      return;
    }

    setSubmittingPayout(true);
    try {
      const res = await requestSellerPayout({
        amount: numAmount,
        method: payoutMethod,
        accountHolder: payoutAccountHolder.trim(),
        walletPhone: payoutWalletPhone.trim(),
        bankName: payoutBankName.trim(),
        accountType: payoutAccountType.trim(),
        accountNumber: payoutAccountNumber.trim(),
        sellerNotes: payoutNotes.trim() || undefined,
        savePayoutInfo: savePayoutDefaults,
      });
      if (res.ok) {
        setPayoutModalOpen(false);
      } else {
        setPayoutFormError(res.error ?? 'Erro ao enviar solicitação de saque.');
      }
    } finally {
      setSubmittingPayout(false);
    }
  };

  const navItems = [
    { id: 'overview' as const, label: 'Visão Geral', icon: BarChart3 },
    { id: 'products' as const, label: 'Produtos', icon: Package },
    { id: 'orders' as const, label: 'Pedidos', icon: ShoppingBag },
    { id: 'finance' as const, label: 'Financeiro e Saques', icon: CreditCard },
    { id: 'settings' as const, label: 'Configurações da Loja', icon: Settings },
  ];

  const statusText =
    seller?.status === 'active'
      ? 'Loja Ativa'
      : seller?.status === 'pending'
        ? 'Pendente de Aprovação'
        : 'Loja Suspensa';

  if (!currentUser || currentUser.role !== 'seller' || !seller) {
    return (
      <main className="max-w-[600px] mx-auto px-4 py-16 text-center">
        <Store className="w-12 h-12 text-[#0475EE] mx-auto mb-3" />
        <h1 className="font-condensed text-2xl font-bold uppercase text-[#0A3768]">
          Painel do Vendedor
        </h1>
        <p className="mt-2 text-sm text-[#666666]">
          Você precisa estar conectado com uma conta de Vendedor com loja ativa para acessar esta área.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <MotionButton
            type="button"
            onClick={() => navigate({ type: 'auth', mode: 'login' })}
            className="h-10 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Fazer Login
          </MotionButton>
          <MotionButton
            type="button"
            onClick={() => navigate({ type: 'auth', mode: 'register' })}
            className="h-10 px-6 rounded-full border border-[#0475EE] text-[#0475EE] hover:bg-[#EAF6FC] text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Cadastrar Loja
          </MotionButton>
        </div>
      </main>
    );
  }

  return (
    <div className="max-w-[1170px] mx-auto px-4 py-6 pb-16">
      {/* Visual Activation Banner if store is not publicly active */}
      {!isPublicActive ? (
        <section
          aria-label="Ativação da Loja"
          className="mb-8 bg-gradient-to-r from-[#0A3768] via-[#0D4B8A] to-[#0475EE] text-white rounded-[4px] p-6 shadow-sm border border-[#0A3768]"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/20">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-amber-950">
                  Modo Privado · Ativação Pendente
                </span>
                <span className="text-xs text-white/80 font-medium">
                  {completedStepsCount} de 3 etapas concluídas ({progressPercent}%)
                </span>
              </div>
              <h2 className="font-condensed text-2xl font-bold uppercase tracking-tight">
                Ativação da sua Loja na CellBox
              </h2>
              <p className="text-xs text-white/90 max-w-2xl mt-1 leading-relaxed">
                Para proteger os compradores e garantir a qualidade dos parceiros, sua loja e produtos permanecem invisíveis no catálogo público até a conclusão de 3 etapas simples.
              </p>
            </div>

            {/* Overall Progress Bar */}
            <div className="w-full md:w-56 shrink-0 bg-white/10 p-3 rounded-[3px] border border-white/15">
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span>Progresso</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#34D399] transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* 3 Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            {/* Step 1: Store Profile */}
            <div className="bg-white/10 rounded-[3px] p-4 border border-white/15 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/70">
                    Etapa 1
                  </span>
                  {profileDone ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300">
                      <Clock className="w-3.5 h-3.5" /> Pendente
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm text-white">Perfil da Loja</h3>
                <p className="text-xs text-white/80 mt-1 leading-relaxed">
                  Nome da loja, categoria de atuação e endereço comercial configurados.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="w-full h-8 px-3 rounded-[3px] bg-white/15 hover:bg-white/25 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {profileDone ? 'Ver Configurações' : 'Completar Perfil'}
                </button>
              </div>
            </div>

            {/* Step 2: KYC Identity Verification */}
            {/* Step 2: KYC Verification */}
            <div className="bg-white/10 rounded-[3px] p-4 border border-white/15 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/70">
                    Etapa 2
                  </span>
                  {kycDone ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" /> KYC Aprovado
                    </span>
                  ) : kycPending ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300">
                      <Clock className="w-3.5 h-3.5" /> KYC em Análise
                    </span>
                  ) : kycRejected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300">
                      <ShieldAlert className="w-3.5 h-3.5" /> KYC Rejeitado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white/70">
                      <ShieldAlert className="w-3.5 h-3.5" /> Obrigatório
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm text-white">Verificação de Identidade (KYC)</h3>
                <p className="text-xs text-white/80 mt-1 leading-relaxed">
                  {kycDone
                    ? `Documento oficial ${seller?.kyc?.documentType ?? 'BI'} validado com sucesso pela administração.`
                    : kycPending
                      ? `Documento ${seller?.kyc?.documentType ?? 'BI'} submetido. A equipa CellBox está a conferir a sua identidade.`
                      : kycRejected
                        ? `Atenção: ${seller?.kyc?.rejectionReason || 'Documento rejeitado. Reenvie fotos legíveis.'}`
                        : 'Envio de BI, NUIT ou Passaporte do responsável legal pela loja.'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10">
                {kycDone ? (
                  <span className="text-xs font-semibold text-emerald-300 block text-center py-1">
                    Documento Aprovado ✓
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setKycModalOpen(true)}
                    className="w-full h-8 px-3 rounded-[3px] bg-white text-[#0A3768] hover:bg-white/90 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {kycPending ? 'Atualizar Documentos' : kycRejected ? 'Reenviar Documentos' : 'Enviar Documento (KYC)'}
                  </button>
                )}
              </div>
            </div>

            {/* Step 3: Registration Fee (100 MZN) */}
            <div className="bg-white/10 rounded-[3px] p-4 border border-white/15 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/70">
                    Etapa 3
                  </span>
                  {feeDone ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 100 MT Confirmado
                    </span>
                  ) : feePending ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300">
                      <Clock className="w-3.5 h-3.5" /> Em Análise Financeira
                    </span>
                  ) : feeRejected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300">
                      <ShieldAlert className="w-3.5 h-3.5" /> Pagamento Rejeitado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300">
                      <CreditCard className="w-3.5 h-3.5" /> 100 MT Pendente
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm text-white">Taxa de Inscrição (100 MZN)</h3>
                <p className="text-xs text-white/80 mt-1 leading-relaxed">
                  {feeDone
                    ? `Taxa paga e confirmada via ${seller?.activation?.feePaymentMethod === 'emola' ? 'e-Mola' : 'M-Pesa'} (Ref: ${seller?.activation?.feeReceipt || seller?.activation?.feeTransactionId || 'OK'}).`
                    : feePending
                      ? `Transação ${seller?.activation?.feeTransactionId || 'enviada'}. A equipa CellBox está a conferir o extrato bancário.`
                      : feeRejected
                        ? `Atenção: ${seller?.activation?.feeRejectionReason || 'Transação não encontrada no extrato.'}`
                        : 'Taxa única de 100 MT de ativação via M-Pesa ou e-Mola.'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10">
                {feeDone ? (
                  <span className="text-xs font-semibold text-emerald-300 block text-center py-1">
                    Taxa Confirmada ✓
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setFeeModalOpen(true)}
                    className="w-full h-8 px-3 rounded-[3px] bg-[#E50914] hover:bg-[#c20811] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {feePending ? 'Atualizar Transação' : feeRejected ? 'Tentar Novamente' : 'Pagar 100 MT'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div
          role="status"
          className="mb-6 bg-emerald-50 border border-emerald-200 rounded-[3px] p-4 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-950">
                Loja Oficial Ativa & Verificada
              </p>
              <p className="text-xs text-emerald-800 mt-0.5">
                Sua vitrine está disponível em /lojas e seus anúncios estão ativos no catálogo CellBox.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate({ type: 'store', sellerId: seller.id })}
            className="h-8 px-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Store className="w-3.5 h-3.5" />
            Ver Loja Pública
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-[270px] shrink-0 bg-white border border-[#EAEAEA] rounded-[3px] p-4 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#EAEAEA]">
            {seller.logoUrl ? (
              <img
                src={seller.logoUrl}
                alt={seller.name}
                className="w-11 h-11 rounded-[3px] object-cover shrink-0 border border-[#DCDCDC]"
              />
            ) : (
              <div
                className="w-11 h-11 rounded-[3px] flex items-center justify-center text-white font-extrabold text-sm shrink-0"
                style={{ backgroundColor: seller.accentColor }}
              >
                {seller.logoText}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#222222] truncate">{seller.name}</p>
              <p className="text-xs text-[#0475EE] font-semibold truncate">{statusText}</p>
            </div>
          </div>

          <nav aria-label="Navegação do Painel do Vendedor" className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[3px] text-[13px] font-bold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0475EE] text-white'
                      : 'text-[#555555] hover:bg-[#F1F2F4] hover:text-[#222222]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-[#EAEAEA] space-y-2">
            <button
              type="button"
              onClick={() => navigate({ type: 'store', sellerId: seller.id })}
              className="w-full h-9 px-3 rounded-full border border-[#DCDCDC] hover:border-[#0475EE] hover:text-[#0475EE] text-xs font-bold uppercase text-[#444444] inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              Ver Vitrine Pública
            </button>
            <button
              type="button"
              onClick={() => navigate({ type: 'home' })}
              className="w-full h-8 px-3 rounded-full text-xs font-semibold text-[#777777] hover:text-[#333333] cursor-pointer"
            >
              Voltar ao Marketplace
            </button>
          </div>
        </aside>

        {/* Main Workspace Content */}
        <main className="flex-1 min-w-0 w-full space-y-6">
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#EAEAEA]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
                Painel do Vendedor / {navItems.find((i) => i.id === activeTab)?.label}
              </p>
              <h1 className="font-condensed text-[28px] font-bold uppercase text-[#0A3768] mt-0.5">
                {navItems.find((i) => i.id === activeTab)?.label}
              </h1>
            </div>
            <div className="flex items-center gap-2.5">
              <MotionButton
                type="button"
                onClick={() => setCsvModalOpen(true)}
                className="h-10 px-4 rounded-full border border-[#DCDCDC] hover:border-[#0475EE] hover:text-[#0475EE] bg-white text-[#444444] text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#0475EE]" />
                Importar CSV
              </MotionButton>
              <MotionButton
                type="button"
                onClick={() => setNewProductOpen(true)}
                className="h-10 px-5 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Novo Produto
              </MotionButton>
            </div>
          </div>

          {/* TAB 1: VISÃO GERAL */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-stretch gap-4">
                <div className="flex-1 min-w-[200px] bg-white border border-[#EAEAEA] rounded-[3px] p-5 flex flex-col justify-between">
                  <p className="text-xs font-semibold text-[#777777]">Vendas do Mês (Bruto)</p>
                  <p className="text-2xl font-extrabold font-mono tabular-nums text-[#222222] mt-2">
                    {formatCurrency(analytics.monthlySales)}
                  </p>
                  <p className="text-xs text-[#777777] mt-1 tabular-nums">
                    {analytics.itemsSold} unidades vendidas
                  </p>
                </div>

                <div className="flex-1 min-w-[200px] bg-white border border-[#EAEAEA] rounded-[3px] p-5 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#777777]">Saldo Disponível para Saque</p>
                    <p className="text-2xl font-extrabold font-mono tabular-nums text-[#0475EE] mt-2">
                      {formatCurrency(analytics.availableBalance)}
                    </p>
                    <p className="text-xs text-[#777777] mt-1 tabular-nums">
                      Líquido liberado após comissão de {commissionRate}%
                      {analytics.escrowNet > 0 ? ` · Em custódia: ${formatCurrency(analytics.escrowNet)}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('finance')}
                    className="mt-2 text-left text-xs font-bold text-[#0475EE] hover:text-[#0A3768] cursor-pointer"
                  >
                    Gerir Saques →
                  </button>
                </div>

                <div className="flex-1 min-w-[200px] bg-white border border-[#EAEAEA] rounded-[3px] p-5 flex flex-col justify-between">
                  <p className="text-xs font-semibold text-[#777777]">Pedidos Pendentes</p>
                  <p className="text-2xl font-extrabold font-mono tabular-nums text-[#18A3DE] mt-2">
                    {analytics.pendingOrdersCount}
                  </p>
                  <p className="text-xs text-[#777777] mt-1 tabular-nums">
                    De {analytics.totalOrdersCount} pedidos totais
                  </p>
                </div>

                <div className="flex-1 min-w-[200px] bg-white border border-[#EAEAEA] rounded-[3px] p-5 flex flex-col justify-between">
                  <p className="text-xs font-semibold text-[#777777]">Avaliação da Loja</p>
                  <p className="text-2xl font-extrabold font-mono tabular-nums text-[#222222] mt-2 inline-flex items-center gap-1.5">
                    <Star className="w-5 h-5 fill-[#F5A623] text-[#F5A623]" />
                    {seller.rating.toFixed(1)}
                  </p>
                  <p className="text-xs text-[#777777] mt-1 tabular-nums">
                    {seller.reviewCount} avaliações de clientes
                  </p>
                </div>
              </div>

              {/* Recent Orders Quick Table */}
              <div className="bg-white border border-[#EAEAEA] rounded-[3px] overflow-hidden">
                <div className="px-5 py-3.5 bg-[#F1F2F4] border-b border-[#E5E7EB] flex items-center justify-between">
                  <h2 className="font-condensed text-[17px] font-bold uppercase text-[#333333]">
                    Últimos Pedidos Recebidos
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-[#0475EE] hover:text-[#0A3768] cursor-pointer"
                  >
                    Ver todos
                  </button>
                </div>
                {sellerOrders.length === 0 ? (
                  <p className="p-8 text-center text-sm text-[#777777]">
                    Nenhum pedido recebido ainda para esta loja.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#FAFAFA] border-b border-[#EAEAEA] text-xs text-[#777777] uppercase">
                        <tr>
                          <th className="py-3 px-5 font-bold">Pedido</th>
                          <th className="py-3 px-4 font-bold">Cliente</th>
                          <th className="py-3 px-4 font-bold">Status</th>
                          <th className="py-3 px-5 font-bold text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAEAEA]">
                        {sellerOrders.slice(0, 5).map((entry) => (
                          <tr key={entry.orderId} className="hover:bg-[#F9FAFB]">
                            <td className="py-3 px-5 font-mono tabular-nums font-bold text-[#333333]">
                              {entry.orderId}
                            </td>
                            <td className="py-3 px-4 text-[#555555]">{entry.buyerName}</td>
                            <td className="py-3 px-4 font-semibold text-[#333333]">
                              {entry.fulfillment.status}
                            </td>
                            <td className="py-3 px-5 text-right font-mono tabular-nums font-bold text-[#0475EE]">
                              {formatCurrency(entry.fulfillment.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GESTÃO DE PRODUTOS */}
          {activeTab === 'products' && (
            <div className="bg-white border border-[#EAEAEA] rounded-[3px] overflow-hidden">
              <div className="p-4 bg-[#F1F2F4] border-b border-[#E5E7EB] flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-[#999999] absolute left-3 top-2.5" />
                  <input
                    type="search"
                    aria-label="Buscar produtos da loja"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar por título ou marca..."
                    className="w-full h-9 pl-9 pr-3 rounded-[2px] bg-white border border-[#DCDCDC] text-xs focus:outline-none focus:border-[#0475EE]"
                  />
                </div>
                <select
                  aria-label="Filtrar por categoria"
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="h-9 px-3 rounded-[2px] border border-[#DCDCDC] bg-white text-xs"
                >
                  <option value="Todas">Todas as categorias</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {sellerProducts.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm font-bold text-[#333333]">
                    Nenhum produto encontrado neste filtro.
                  </p>
                  <button
                    type="button"
                    onClick={() => setNewProductOpen(true)}
                    className="mt-4 h-9 px-5 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase cursor-pointer"
                  >
                    + Cadastrar primeiro produto
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#FAFAFA] border-b border-[#EAEAEA] text-xs text-[#777777] uppercase">
                      <tr>
                        <th className="py-3 px-5 font-bold">Produto</th>
                        <th className="py-3 px-4 font-bold">Categoria</th>
                        <th className="py-3 px-4 font-bold">Condição</th>
                        <th className="py-3 px-4 font-bold text-right">Estoque</th>
                        <th className="py-3 px-4 font-bold text-right">Preço</th>
                        <th className="py-3 px-5 font-bold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAEAEA]">
                      {sellerProducts.map((p) => {
                        const isEditing = editingProductId === p.id;
                        return (
                          <tr key={p.id} className="hover:bg-[#F9FAFB]">
                            <td className="py-3 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-9 rounded-[2px] overflow-hidden bg-white border border-[#EAEAEA] shrink-0">
                                  <ProductImage
                                    src={p.images[0]}
                                    alt={p.title}
                                    category={p.category}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-[#333333] truncate max-w-[260px]">
                                    {p.title}
                                  </p>
                                  <p className="text-xs text-[#777777]">{p.brand}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[#666666]">{p.category}</td>
                            <td className="py-3 px-4 text-[#444444]">{p.condition}</td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-[#333333]">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min={0}
                                  aria-label={`Editar estoque de ${p.title}`}
                                  value={editStock}
                                  onChange={(e) => setEditStock(e.target.value)}
                                  className="w-16 h-8 px-2 text-right border border-[#0475EE] rounded-[2px] text-xs font-mono"
                                />
                              ) : (
                                p.stock
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-[#0475EE]">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min={1}
                                  aria-label={`Editar preço de ${p.title}`}
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  className="w-24 h-8 px-2 text-right border border-[#0475EE] rounded-[2px] text-xs font-mono"
                                />
                              ) : (
                                formatCurrency(p.price)
                              )}
                            </td>
                            <td className="py-3 px-5 text-right">
                              <div className="inline-flex items-center gap-1">
                                {isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      aria-label={`Salvar alterações de ${p.title}`}
                                      onClick={() => {
                                        const nextPrice = Number(editPrice);
                                        const nextStock = Number(editStock);
                                        if (nextPrice > 0 && nextStock >= 0) {
                                          void updateProduct(p.id, {
                                            price: nextPrice,
                                            stock: nextStock,
                                          });
                                        }
                                        setEditingProductId(null);
                                      }}
                                      className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-[2px] cursor-pointer"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      aria-label="Cancelar edição"
                                      onClick={() => setEditingProductId(null)}
                                      className="p-2 text-[#777777] hover:bg-[#F1F2F4] rounded-[2px] cursor-pointer"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    aria-label={`Editar ${p.title}`}
                                    onClick={() => {
                                      setEditingProductId(p.id);
                                      setEditPrice(String(p.price));
                                      setEditStock(String(p.stock));
                                    }}
                                    className="p-2 text-[#777777] hover:text-[#0475EE] rounded-[2px] hover:bg-[#EAF6FC] cursor-pointer"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  aria-label={`Excluir ${p.title}`}
                                  onClick={() => void deleteProduct(p.id)}
                                  className="p-2 text-[#999999] hover:text-rose-600 rounded-[2px] hover:bg-rose-50 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GESTÃO DE PEDIDOS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {sellerOrders.length === 0 ? (
                <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-12 text-center text-sm text-[#777777]">
                  Ainda não há pedidos registrados para {seller.name}.
                </div>
              ) : (
                sellerOrders.map((entry) => {
                  const nextStatus = getNextOrderStatus(entry.fulfillment.status);
                  return (
                    <div
                      key={entry.orderId}
                      className="bg-white border border-[#EAEAEA] rounded-[3px] p-5 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#EAEAEA]">
                        <div>
                          <p className="text-sm font-bold font-mono tabular-nums text-[#222222]">
                            Pedido {entry.orderId}
                          </p>
                          <p className="text-xs text-[#777777] mt-0.5">
                            Cliente: {entry.buyerName} · {entry.city} · {entry.createdAt}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-[#555555]">
                            Status atual:{' '}
                            <span
                              className={
                                entry.fulfillment.status === 'Entregue'
                                  ? 'text-[#0A3768]'
                                  : 'text-[#18A3DE]'
                              }
                            >
                              {entry.fulfillment.status}
                            </span>
                          </span>
                          {nextStatus ? (
                            <MotionButton
                              type="button"
                              onClick={() =>
                                void updateOrderFulfillmentStatus(entry.orderId, seller.id, nextStatus)
                              }
                              className="h-8 px-4 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-[11px] font-bold uppercase inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                            >
                              Avançar para {nextStatus}
                              <ArrowRight className="w-3.5 h-3.5" />
                            </MotionButton>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0A3768]">
                              <CheckCircle2 className="w-4 h-4 text-[#0475EE]" />
                              Concluído
                            </span>
                          )}
                        </div>
                      </div>

                      <ul className="divide-y divide-[#EAEAEA] text-sm">
                        {entry.fulfillment.items.map((item) => (
                          <li
                            key={item.productId}
                            className="py-2 flex items-center justify-between gap-4"
                          >
                            <span className="text-[#333333] font-medium">
                              {item.quantity}x {item.title}
                            </span>
                            <span className="font-mono tabular-nums font-bold text-[#0475EE] whitespace-nowrap">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 4: FINANCEIRO & SAQUES (MODO A) */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              {/* Banner Explicativo da Custódia Segura */}
              <div className="bg-[#EAF6FC] border border-[#BFE3F7] rounded-[3px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#0A3768] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#0475EE]" />
                    Regra Financeira Cellbox (Custódia Segura · Modo A)
                  </p>
                  <p className="text-xs text-[#334155] leading-relaxed">
                    A comissão da plataforma (<strong>{commissionRate}%</strong>) é retida na fonte. Valores de pedidos em transporte ficam{' '}
                    <strong>Em Custódia</strong> e são liberados para saque assim que o pedido é marcado como <strong>Entregue</strong>.
                  </p>
                </div>
                <MotionButton
                  type="button"
                  data-testid="seller-open-payout-modal-btn"
                  disabled={analytics.availableBalance <= 0}
                  onClick={openPayoutModal}
                  className="h-10 px-5 rounded-full bg-[#0475EE] hover:bg-[#0A3768] disabled:bg-[#94A3B8] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
                >
                  <CreditCard className="w-4 h-4" />
                  Solicitar Saque
                </MotionButton>
              </div>

              {/* 4 KPIs Financeiros */}
              <div className="flex flex-wrap items-stretch gap-4">
                <div className="flex-1 min-w-[200px] bg-white border border-[#EAEAEA] rounded-[3px] p-5 flex flex-col justify-between">
                  <p className="text-xs font-semibold text-[#777777]">Vendas Brutas Totais</p>
                  <p className="text-2xl font-extrabold font-mono tabular-nums text-[#222222] mt-2">
                    {formatCurrency(analytics.monthlySales)}
                  </p>
                  <p className="text-xs text-[#777777] mt-1 tabular-nums">
                    {analytics.totalOrdersCount} pedidos · {analytics.itemsSold} itens
                  </p>
                </div>

                <div className="flex-1 min-w-[200px] bg-white border border-[#EAEAEA] rounded-[3px] p-5 flex flex-col justify-between">
                  <p className="text-xs font-semibold text-[#777777]">
                    Comissão Cellbox ({commissionRate}%)
                  </p>
                  <p className="text-2xl font-extrabold font-mono tabular-nums text-[#64748B] mt-2">
                    {formatCurrency(analytics.commissionDeducted)}
                  </p>
                  <p className="text-xs text-[#777777] mt-1">Retida automaticamente na fonte</p>
                </div>

                <div className="flex-1 min-w-[200px] bg-white border border-[#EAEAEA] rounded-[3px] p-5 flex flex-col justify-between">
                  <p className="text-xs font-semibold text-[#777777]">Saldo em Custódia (A Liberar)</p>
                  <p className="text-2xl font-extrabold font-mono tabular-nums text-amber-600 mt-2">
                    {formatCurrency(analytics.escrowNet)}
                  </p>
                  <p className="text-xs text-[#777777] mt-1 tabular-nums">
                    {analytics.pendingOrdersCount} pedidos em trânsito
                  </p>
                </div>

                <div className="flex-1 min-w-[200px] bg-white border border-[#0475EE]/30 rounded-[3px] p-5 bg-gradient-to-b from-white to-[#F7FBFF] flex flex-col justify-between">
                  <p className="text-xs font-bold text-[#0A3768]">Saldo Disponível para Saque</p>
                  <p
                    data-testid="seller-available-balance"
                    className="text-2xl font-extrabold font-mono tabular-nums text-[#0475EE] mt-2"
                  >
                    {formatCurrency(analytics.availableBalance)}
                  </p>
                  <p className="text-[11px] text-[#64748B] mt-1 tabular-nums">
                    Já recebido: {formatCurrency(analytics.paidPayoutsTotal)} · Em análise:{' '}
                    {formatCurrency(analytics.pendingPayoutsTotal)}
                  </p>
                </div>
              </div>

              {/* Resumo da Conta / Carteira Configurada */}
              <div className="bg-white border border-[#EAEAEA] rounded-[3px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-condensed text-[16px] font-bold uppercase text-[#0A3768]">
                    Conta / Carteira de Repasse Configurada
                  </h2>
                  <p className="text-sm font-medium text-[#333333] mt-1">
                    {formatSellerPayoutSummary(seller.payoutInfo)}
                  </p>
                  {seller.payoutInfo?.accountHolder && (
                    <p className="text-xs text-[#666666] mt-0.5">
                      Titular: {seller.payoutInfo.accountHolder}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="h-9 px-4 rounded-full border border-[#DCDCDC] hover:border-[#0475EE] text-xs font-bold uppercase text-[#444444] hover:text-[#0475EE] whitespace-nowrap cursor-pointer"
                >
                  Editar Conta de Destino
                </button>
              </div>

              {/* Histórico de Solicitações de Saque */}
              <div className="bg-white border border-[#EAEAEA] rounded-[3px] overflow-hidden">
                <div className="px-5 py-3.5 bg-[#F1F2F4] border-b border-[#E5E7EB] flex items-center justify-between">
                  <h2 className="font-condensed text-[17px] font-bold uppercase text-[#333333]">
                    Histórico de Solicitações de Saque
                  </h2>
                  <span className="text-xs font-bold text-[#64748B]">
                    {sellerPayouts.length} {sellerPayouts.length === 1 ? 'registro' : 'registros'}
                  </span>
                </div>

                {sellerPayouts.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[#777777]">
                    Nenhuma solicitação de saque realizada ainda. Quando tiver saldo de pedidos entregues, clique em <strong>Solicitar Saque</strong>.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#FAFAFA] border-b border-[#EAEAEA] text-xs text-[#777777] uppercase">
                        <tr>
                          <th className="py-3 px-4 font-bold">Data</th>
                          <th className="py-3 px-4 font-bold">Destino</th>
                          <th className="py-3 px-4 font-bold text-right">Valor</th>
                          <th className="py-3 px-4 font-bold">Status</th>
                          <th className="py-3 px-4 font-bold">Referência / Detalhes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAEAEA]">
                        {sellerPayouts.map((p) => (
                          <tr key={p.id} className="hover:bg-[#F9FAFB]">
                            <td className="py-3 px-4 text-xs text-[#555555] whitespace-nowrap font-mono">
                              {p.requestedAt.slice(0, 10)}
                            </td>
                            <td className="py-3 px-4 text-xs font-medium text-[#333333]">
                              {p.destinationSummary}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-[#0A3768] whitespace-nowrap">
                              {formatCurrency(p.amount)}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {p.status === 'paid' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" /> Pago / Transferido
                                </span>
                              ) : p.status === 'rejected' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <ShieldAlert className="w-3 h-3" /> Rejeitado (Estornado)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <Clock className="w-3 h-3" /> Aguardando Envio
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-[#555555]">
                              {p.status === 'paid' && (
                                <div className="space-y-0.5">
                                  {p.transactionRef && (
                                    <p className="font-mono font-bold text-[#0A3768]">
                                      Ref: {p.transactionRef}
                                    </p>
                                  )}
                                  {p.proofUrl && (
                                    <a
                                      href={p.proofUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-[#0475EE] hover:underline font-semibold"
                                    >
                                      Ver Comprovante <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                  {p.adminNotes && <p className="text-[#666666]">{p.adminNotes}</p>}
                                </div>
                              )}
                              {p.status === 'rejected' && (
                                <p className="text-rose-700 font-medium">
                                  {p.adminNotes || 'Solicitação recusada pelo financeiro.'}
                                </p>
                              )}
                              {p.status === 'pending' && (
                                <span className="text-[#777777]">
                                  {p.sellerNotes || 'Em fila de conferência e transferência'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Extrato Detalhado por Pedido */}
              <div className="bg-white border border-[#EAEAEA] rounded-[3px] overflow-hidden">
                <div className="px-5 py-3.5 bg-[#F1F2F4] border-b border-[#E5E7EB]">
                  <h2 className="font-condensed text-[17px] font-bold uppercase text-[#333333]">
                    Extrato Detalhado por Pedido (Retenção na Fonte)
                  </h2>
                </div>
                {sellerOrders.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[#777777]">
                    Nenhuma venda registrada ainda para esta loja.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#FAFAFA] border-b border-[#EAEAEA] text-xs text-[#777777] uppercase">
                        <tr>
                          <th className="py-3 px-4 font-bold">Pedido</th>
                          <th className="py-3 px-4 font-bold">Data</th>
                          <th className="py-3 px-4 font-bold">Custódia / Entrega</th>
                          <th className="py-3 px-4 font-bold text-right">Bruto</th>
                          <th className="py-3 px-4 font-bold text-right">Comissão</th>
                          <th className="py-3 px-4 font-bold text-right">Líquido Loja</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAEAEA]">
                        {sellerOrders.map((entry) => {
                          const orderRef = orders.find((o) => o.id === entry.orderId);
                          const rate =
                            typeof orderRef?.commissionRateSnapshot === 'number'
                              ? orderRef.commissionRateSnapshot
                              : commissionRate;
                          const comm = Number((entry.fulfillment.subtotal * (rate / 100)).toFixed(2));
                          const net = Math.max(0, Number((entry.fulfillment.subtotal - comm).toFixed(2)));
                          const isReleased = entry.fulfillment.status === 'Entregue';
                          return (
                            <tr key={entry.orderId} className="hover:bg-[#F9FAFB]">
                              <td className="py-3 px-4 font-mono font-bold text-[#333333]">
                                {entry.orderId}
                              </td>
                              <td className="py-3 px-4 text-xs font-mono text-[#666666]">
                                {entry.createdAt}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                    isReleased
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-amber-50 text-amber-800'
                                  }`}
                                >
                                  {entry.fulfillment.status} · {isReleased ? 'Liberado' : 'Em Custódia'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono tabular-nums text-[#444444]">
                                {formatCurrency(entry.fulfillment.subtotal)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-600">
                                -{formatCurrency(comm)} ({rate}%)
                              </td>
                              <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-[#0475EE]">
                                {formatCurrency(net)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: CONFIGURAÇÕES DA LOJA E PERFIL DO VENDEDOR */}
          {activeTab === 'settings' && (
            <div className="space-y-8">
              {/* SEÇÃO 1: PERFIL DA LOJA */}
              <form
                onSubmit={handleSaveStoreSettings}
                className="bg-white border border-[#EAEAEA] rounded-[3px] p-6 space-y-6"
              >
                <div>
                  <h2 className="font-condensed text-[20px] font-bold uppercase text-[#0A3768] flex items-center gap-2">
                    <Store className="w-5 h-5 text-[#0475EE]" />
                    Perfil da Loja (Vitrine Pública)
                  </h2>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Informações exibidas publicamente na sua página de loja e no catálogo CellBox.
                  </p>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="store-name" className="block text-xs font-bold text-[#444444] mb-1">
                        Nome da Loja *
                      </label>
                      <input
                        id="store-name"
                        type="text"
                        required
                        value={storeForm.name}
                        onChange={(e) => setStoreForm((p) => ({ ...p, name: e.target.value }))}
                        className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
                      />
                    </div>

                    <div>
                      <label htmlFor="store-main-cat" className="block text-xs font-bold text-[#444444] mb-1">
                        Categoria da Loja *
                      </label>
                      <select
                        id="store-main-cat"
                        value={storeForm.mainCategory}
                        onChange={(e) => setStoreForm((p) => ({ ...p, mainCategory: e.target.value }))}
                        className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] bg-white text-sm"
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        <option value="Beleza & Cosméticos">Beleza & Cosméticos</option>
                        <option value="Moda & Acessórios">Moda & Acessórios</option>
                        <option value="Casa & Decoração">Casa & Decoração</option>
                        <option value="Variedades">Variedades</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="store-desc" className="block text-xs font-bold text-[#444444] mb-1">
                        Descrição da Loja (opcional)
                      </label>
                      <textarea
                        id="store-desc"
                        rows={3}
                        value={storeForm.description}
                        onChange={(e) => setStoreForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Conte a história da sua loja, principais marcas e compromissos com o cliente..."
                        className="w-full p-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
                      />
                    </div>

                    <div>
                      <label htmlFor="store-loc" className="block text-xs font-bold text-[#444444] mb-1">
                        Localização da Loja (opcional)
                      </label>
                      <input
                        id="store-loc"
                        type="text"
                        value={storeForm.location}
                        onChange={(e) => setStoreForm((p) => ({ ...p, location: e.target.value }))}
                        placeholder="Ex: Av. 24 de Julho, Maputo ou Online"
                        className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="store-logo" className="block text-xs font-bold text-[#444444] mb-1">
                          Sigla Logotipo
                        </label>
                        <input
                          id="store-logo"
                          type="text"
                          maxLength={3}
                          value={storeForm.logoText}
                          onChange={(e) => setStoreForm((p) => ({ ...p, logoText: e.target.value }))}
                          className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm uppercase font-bold"
                        />
                      </div>
                      <div>
                        <label htmlFor="store-color" className="block text-xs font-bold text-[#444444] mb-1">
                          Cor da Marca
                        </label>
                        <input
                          id="store-color"
                          type="color"
                          value={storeForm.accentColor}
                          onChange={(e) => setStoreForm((p) => ({ ...p, accentColor: e.target.value }))}
                          className="w-full h-10 p-1 rounded-[2px] border border-[#DCDCDC] bg-white cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* UPLOADS COM PRÉ-VISUALIZAÇÃO E VALIDAÇÕES RIGOROSAS (1:1 e 16:9) */}
                  <div className="mt-6 pt-5 border-t border-[#EAEAEA] grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logotipo da Loja */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-[#444444]">
                          Logotipo da Loja (opcional)
                        </label>
                        <p className="text-[11px] text-[#777777]">
                          Proporção 1:1 (recomendado 500x500 px), tamanho máx. 5 MB.
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-[4px] border border-[#DCDCDC] overflow-hidden bg-[#F0F4F8] flex items-center justify-center shrink-0 shadow-inner relative group">
                          {storeForm.logoUrl ? (
                            <img
                              src={storeForm.logoUrl}
                              alt="Logotipo"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center text-white font-black text-xl"
                              style={{ backgroundColor: storeForm.accentColor }}
                            >
                              {storeForm.logoText || 'CB'}
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="h-9 px-4 rounded-[2px] border border-[#0475EE] text-[#0475EE] hover:bg-[#EAF6FC] text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            {uploadingLogoImg ? 'Enviando...' : 'Enviar Logotipo'}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/avif"
                              disabled={uploadingLogoImg}
                              onChange={(e) => void handleLogoUpload(e)}
                              className="sr-only"
                            />
                          </label>
                          {storeForm.logoUrl && (
                            <div>
                              <button
                                type="button"
                                onClick={() => setStoreForm((p) => ({ ...p, logoUrl: '' }))}
                                className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                              >
                                Remover logotipo
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Capa / Banner da Loja */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-[#444444]">
                          Capa da Loja (opcional)
                        </label>
                        <p className="text-[11px] text-[#777777]">
                          Proporção 16:9 (recomendado 1000x500 px), tamanho máx. 5 MB.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full aspect-[16/9] max-h-48 rounded-[4px] border border-[#DCDCDC] overflow-hidden bg-[#F0F4F8] flex items-center justify-center relative">
                          {storeForm.bannerImage ? (
                            <img
                              src={storeForm.bannerImage}
                              alt="Capa da Loja"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-[#888888]">Nenhuma capa configurada</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="h-9 px-4 rounded-[2px] border border-[#0475EE] text-[#0475EE] hover:bg-[#EAF6FC] text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            {uploadingBannerImg ? 'Enviando...' : 'Enviar Capa'}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/avif"
                              disabled={uploadingBannerImg}
                              onChange={(e) => void handleBannerImageUpload(e)}
                              className="sr-only"
                            />
                          </label>
                          {storeForm.bannerImage && (
                            <button
                              type="button"
                              onClick={() => setStoreForm((p) => ({ ...p, bannerImage: '' }))}
                              className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                            >
                              Remover capa
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Redes Sociais da Loja */}
                  <div className="mt-6 pt-5 border-t border-[#EAEAEA]">
                    <h3 className="font-condensed text-[16px] font-bold uppercase text-[#0A3768] mb-3">
                      Redes Sociais da Loja (todas opcionais)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="soc-fb" className="block text-xs font-bold text-[#444444] mb-1">
                          Facebook
                        </label>
                        <input
                          id="soc-fb"
                          type="text"
                          value={storeForm.facebook}
                          onChange={(e) => setStoreForm((p) => ({ ...p, facebook: e.target.value }))}
                          placeholder="https://facebook.com/sualoja"
                          className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="soc-ig" className="block text-xs font-bold text-[#444444] mb-1">
                          Instagram
                        </label>
                        <input
                          id="soc-ig"
                          type="text"
                          value={storeForm.instagram}
                          onChange={(e) => setStoreForm((p) => ({ ...p, instagram: e.target.value }))}
                          placeholder="https://instagram.com/sualoja"
                          className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="soc-tt" className="block text-xs font-bold text-[#444444] mb-1">
                          TikTok
                        </label>
                        <input
                          id="soc-tt"
                          type="text"
                          value={storeForm.tiktok}
                          onChange={(e) => setStoreForm((p) => ({ ...p, tiktok: e.target.value }))}
                          placeholder="https://tiktok.com/@sualoja"
                          className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="soc-yt" className="block text-xs font-bold text-[#444444] mb-1">
                          YouTube
                        </label>
                        <input
                          id="soc-yt"
                          type="text"
                          value={storeForm.youtube}
                          onChange={(e) => setStoreForm((p) => ({ ...p, youtube: e.target.value }))}
                          placeholder="https://youtube.com/@sualoja"
                          className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dados Bancários */}
                  <div className="mt-6 pt-5 border-t border-[#EAEAEA]">
                    <h3 className="font-condensed text-[16px] font-bold uppercase text-[#0A3768] mb-3">
                      Dados Bancários / Carteira de Repasse
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="bank-holder" className="block text-xs font-bold text-[#444444] mb-1">
                          Titular da Conta / Carteira
                        </label>
                        <input
                          id="bank-holder"
                          type="text"
                          value={storeForm.accountHolder}
                          onChange={(e) => setStoreForm((p) => ({ ...p, accountHolder: e.target.value }))}
                          placeholder="Nome completo do beneficiário"
                          className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="bank-preferred-method" className="block text-xs font-bold text-[#444444] mb-1">
                          Método Preferencial de Repasse
                        </label>
                        <select
                          id="bank-preferred-method"
                          value={storeForm.preferredMethod}
                          onChange={(e) =>
                            setStoreForm((p) => ({
                              ...p,
                              preferredMethod: e.target.value as PayoutMethod,
                            }))
                          }
                          className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] bg-white text-sm"
                        >
                          <option value="mpesa">M-Pesa (Carteira Móvel)</option>
                          <option value="emola">e-Mola (Carteira Móvel)</option>
                          <option value="bank_transfer">Transferência Bancária (NIB)</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="bank-name" className="block text-xs font-bold text-[#444444] mb-1">
                          Banco / Instituição
                        </label>
                        <input
                          id="bank-name"
                          type="text"
                          value={storeForm.bankName}
                          onChange={(e) => setStoreForm((p) => ({ ...p, bankName: e.target.value }))}
                          className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="bank-acc" className="block text-xs font-bold text-[#444444] mb-1">
                          NIB / Conta Bancária
                        </label>
                        <input
                          id="bank-acc"
                          type="text"
                          value={storeForm.accountNumber}
                          onChange={(e) => setStoreForm((p) => ({ ...p, accountNumber: e.target.value }))}
                          className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm font-mono"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="bank-pix" className="block text-xs font-bold text-[#444444] mb-1">
                          Carteira Móvel (M-Pesa / e-Mola)
                        </label>
                        <input
                          id="bank-pix"
                          type="text"
                          value={storeForm.pixOrWallet}
                          onChange={(e) => setStoreForm((p) => ({ ...p, pixOrWallet: e.target.value }))}
                          className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[#EAEAEA]">
                  <MotionButton
                    type="submit"
                    disabled={savingStoreSettings}
                    className="h-10 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider disabled:opacity-60 cursor-pointer"
                  >
                    {savingStoreSettings ? 'Salvando...' : 'Salvar Perfil da Loja'}
                  </MotionButton>
                </div>
              </form>

              {/* SEÇÃO 2: PERFIL PESSOAL DO RESPONSÁVEL */}
              <form
                onSubmit={handleSavePersonalProfile}
                className="bg-white border border-[#EAEAEA] rounded-[3px] p-6 space-y-6"
              >
                <div>
                  <h2 className="font-condensed text-[20px] font-bold uppercase text-[#0A3768] flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-[#0475EE]" />
                    Perfil Pessoal do Responsável
                  </h2>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Dados pessoais do titular da loja cadastrados na Etapa 1.
                  </p>

                  {/* Foto de Perfil */}
                  <div className="flex items-center gap-4 mt-5 pb-5 border-b border-[#EAEAEA]">
                    <div className="w-16 h-16 rounded-full border border-[#DCDCDC] overflow-hidden bg-[#F0F4F8] flex items-center justify-center shrink-0 shadow-inner">
                      {personalAvatarUrl ? (
                        <img
                          src={personalAvatarUrl}
                          alt={personalName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-7 h-7 text-[#888888]" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#444444] mb-0.5">Foto de Perfil (opcional)</p>
                      <p className="text-[11px] text-[#777777] mb-2">Recomendado: 500x500 px (1:1), máx. 5 MB</p>
                      <label className="h-8 px-3.5 rounded-[3px] border border-[#DCDCDC] hover:border-[#0475EE] bg-[#F9FAFB] text-xs font-semibold text-[#333333] inline-flex items-center gap-2 cursor-pointer transition-colors">
                        <Camera className="w-3.5 h-3.5 text-[#0475EE]" />
                        {uploadingPersonalAvatar ? 'Carregando...' : 'Alterar Foto'}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/avif"
                          onChange={(e) => void handlePersonalAvatarUpload(e)}
                          disabled={uploadingPersonalAvatar}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="seller-name" className="block text-xs font-bold text-[#444444] mb-1">
                        Nome Completo do Responsável *
                      </label>
                      <input
                        id="seller-name"
                        type="text"
                        required
                        value={personalName}
                        onChange={(e) => setPersonalName(e.target.value)}
                        className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
                      />
                    </div>

                    <div>
                      <label htmlFor="seller-phone" className="block text-xs font-bold text-[#444444] mb-1">
                        Número de Telefone (Acesso Principal) *
                      </label>
                      <input
                        id="seller-phone"
                        type="text"
                        required
                        value={personalPhone}
                        onChange={(e) => setPersonalPhone(e.target.value)}
                        placeholder="+258 84 000 0000"
                        className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm font-mono focus:outline-none focus:border-[#0475EE]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="seller-email" className="block text-xs font-bold text-[#444444] mb-1">
                        E-mail de Notificações (opcional)
                      </label>
                      <input
                        id="seller-email"
                        type="email"
                        disabled
                        value={currentUser.email}
                        className="w-full h-10 px-3 rounded-[2px] border border-[#EAEAEA] bg-[#F7F8FA] text-sm text-[#888888]"
                      />
                    </div>
                  </div>

                  {/* Endereço do Vendedor */}
                  <div className="mt-6 pt-5 border-t border-[#EAEAEA]">
                    <h3 className="font-condensed text-[16px] font-bold uppercase text-[#0A3768] mb-3">
                      Endereço do Responsável
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="seller-prov" className="block text-xs font-bold text-[#444444] mb-1">
                          Província *
                        </label>
                        <select
                          id="seller-prov"
                          value={personalProvince}
                          onChange={(e) => setPersonalProvince(e.target.value)}
                          className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] bg-white text-sm"
                        >
                          {MOZAMBIQUE_PROVINCES.map((prov) => (
                            <option key={prov} value={prov}>
                              {prov}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="seller-city" className="block text-xs font-bold text-[#444444] mb-1">
                          Cidade *
                        </label>
                        <input
                          id="seller-city"
                          type="text"
                          required
                          value={personalCity}
                          onChange={(e) => setPersonalCity(e.target.value)}
                          placeholder="Ex: Matola, Maputo, Nampula"
                          className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="seller-neigh" className="block text-xs font-bold text-[#444444] mb-1">
                          Bairro *
                        </label>
                        <input
                          id="seller-neigh"
                          type="text"
                          required
                          value={personalNeighborhood}
                          onChange={(e) => setPersonalNeighborhood(e.target.value)}
                          placeholder="Ex: Liberdade, Triunfo"
                          className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="seller-zip" className="block text-xs font-bold text-[#444444] mb-1">
                          Código Postal *
                        </label>
                        <input
                          id="seller-zip"
                          type="text"
                          required
                          value={personalZipCode}
                          onChange={(e) => setPersonalZipCode(e.target.value)}
                          placeholder="1100"
                          className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[#EAEAEA]">
                  <MotionButton
                    type="submit"
                    disabled={savingPersonalProfile}
                    className="h-10 px-6 rounded-full bg-[#0A3768] hover:bg-[#0475EE] text-white text-xs font-bold uppercase tracking-wider disabled:opacity-60 cursor-pointer"
                  >
                    {savingPersonalProfile ? 'Salvando...' : 'Salvar Dados Pessoais'}
                  </MotionButton>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: CADASTRAR NOVO PRODUTO (UNIVERSAL E DINÂMICO) */}
      {newProductOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-product-modal-title"
        >
          <div className="bg-white rounded-[4px] border border-[#E0E0E0] max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#F1F2F4] border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h2
                  id="new-product-modal-title"
                  className="font-condensed text-[20px] font-bold uppercase text-[#0A3768]"
                >
                  Cadastrar Novo Produto — {seller.name}
                </h2>
                <p className="text-xs text-[#666666]">
                  Formulário universal multi-categoria com atributos dinâmicos e fotos reais.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewProductOpen(false)}
                aria-label="Fechar formulário de produto"
                className="p-1.5 rounded-[2px] text-[#666666] hover:bg-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUniversalProduct} className="overflow-y-auto p-6 space-y-6">
              {/* Informações Principais */}
              <div>
                <h3 className="font-condensed text-[16px] font-bold uppercase text-[#0A3768] mb-3">
                  1. Informações Básicas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="np-title" className="block text-xs font-bold text-[#444444] mb-1">
                      Nome do Produto *
                    </label>
                    <input
                      id="np-title"
                      type="text"
                      required
                      value={formState.title}
                      onChange={(e) => setFormState((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Ex: iPhone 15 Pro Max, Creme Hidratante Facial 200ml, Tênis Esportivo..."
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
                    />
                    {formErrors.title && (
                      <p className="text-xs text-rose-600 mt-1">{formErrors.title}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="np-cat" className="block text-xs font-bold text-[#444444] mb-1">
                      Categoria *
                    </label>
                    <select
                      id="np-cat"
                      value={formState.category}
                      onChange={(e) => setFormState((p) => ({ ...p, category: e.target.value }))}
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] bg-white text-sm"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="Beleza & Cosméticos">Beleza & Cosméticos</option>
                      <option value="Moda & Calçados">Moda & Calçados</option>
                      <option value="Casa & Eletrodomésticos">Casa & Eletrodomésticos</option>
                      <option value="Acessórios & Outros">Acessórios & Outros</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="np-subcat" className="block text-xs font-bold text-[#444444] mb-1">
                      Subcategoria (opcional)
                    </label>
                    <input
                      id="np-subcat"
                      type="text"
                      value={formState.subcategory}
                      onChange={(e) => setFormState((p) => ({ ...p, subcategory: e.target.value }))}
                      placeholder="Ex: Skincare, Capas, Notebooks, Calçados"
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="np-brand" className="block text-xs font-bold text-[#444444] mb-1">
                      Marca (opcional)
                    </label>
                    <input
                      id="np-brand"
                      type="text"
                      value={formState.brand}
                      onChange={(e) => setFormState((p) => ({ ...p, brand: e.target.value }))}
                      placeholder="Ex: Apple, Samsung, CeraVe, Nike, Genérica"
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="np-cond" className="block text-xs font-bold text-[#444444] mb-1">
                      Condição do Produto
                    </label>
                    <select
                      id="np-cond"
                      value={formState.condition}
                      onChange={(e) =>
                        setFormState((p) => ({ ...p, condition: e.target.value as ProductCondition }))
                      }
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] bg-white text-sm"
                    >
                      <option value="Novo">Novo</option>
                      <option value="Recondicionado">Recondicionado</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="np-price" className="block text-xs font-bold text-[#444444] mb-1">
                      Preço (MT) *
                    </label>
                    <input
                      id="np-price"
                      type="number"
                      min={1}
                      step="0.01"
                      required
                      value={formState.price}
                      onChange={(e) => setFormState((p) => ({ ...p, price: e.target.value }))}
                      placeholder="1500"
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm font-mono focus:outline-none focus:border-[#0475EE]"
                    />
                    {formErrors.price && (
                      <p className="text-xs text-rose-600 mt-1">{formErrors.price}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="np-orig-price" className="block text-xs font-bold text-[#444444] mb-1">
                      Preço Promocional / Anterior (opcional)
                    </label>
                    <input
                      id="np-orig-price"
                      type="number"
                      min={1}
                      step="0.01"
                      value={formState.originalPrice}
                      onChange={(e) => setFormState((p) => ({ ...p, originalPrice: e.target.value }))}
                      placeholder="Ex: 1800 (para exibir riscado)"
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label htmlFor="np-stock" className="block text-xs font-bold text-[#444444] mb-1">
                      Quantidade em Stock *
                    </label>
                    <input
                      id="np-stock"
                      type="number"
                      min={0}
                      required
                      value={formState.stock}
                      onChange={(e) => setFormState((p) => ({ ...p, stock: e.target.value }))}
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Descrição Detalhada */}
              <div>
                <label htmlFor="np-desc" className="block text-xs font-bold text-[#444444] mb-1">
                  Descrição Detalhada do Produto *
                </label>
                <textarea
                  id="np-desc"
                  rows={3}
                  required
                  value={formState.description}
                  onChange={(e) => setFormState((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Descreva detalhes, modo de uso, composição, itens inclusos e diferenciais do produto..."
                  className="w-full p-3 rounded-[2px] border border-[#DCDCDC] text-sm focus:outline-none focus:border-[#0475EE]"
                />
                {formErrors.description && (
                  <p className="text-xs text-rose-600 mt-1">{formErrors.description}</p>
                )}
              </div>

              {/* UPLOAD REAL DE IMAGENS DO PRODUTO (GALERIA) */}
              <div className="pt-4 border-t border-[#EAEAEA]">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-condensed text-[16px] font-bold uppercase text-[#0A3768]">
                      2. Imagens do Produto (Múltiplas Fotos)
                    </h3>
                    <p className="text-[11px] text-[#777777]">
                      Envie arquivos reais de foto (máx. 5 MB por imagem). A primeira imagem é a principal.
                    </p>
                  </div>
                  <label className="h-9 px-4 rounded-[2px] bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingProductImages ? 'Enviando...' : '+ Enviar Fotos'}
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp,image/avif"
                      disabled={uploadingProductImages}
                      onChange={(e) => void handleProductImageFiles(e)}
                      className="sr-only"
                    />
                  </label>
                </div>

                {/* Opção alternativa: Adicionar por URL */}
                <div className="flex gap-2 mt-2 mb-3">
                  <input
                    type="url"
                    value={customImageUrlInput}
                    onChange={(e) => setCustomImageUrlInput(e.target.value)}
                    placeholder="Ou cole o link direto de uma imagem na internet e clique em Adicionar"
                    className="flex-1 h-9 px-3 rounded-[2px] border border-[#DCDCDC] text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomImageUrl}
                    className="h-9 px-4 rounded-[2px] border border-[#0475EE] text-[#0475EE] hover:bg-[#EAF6FC] text-xs font-bold cursor-pointer"
                  >
                    Adicionar URL
                  </button>
                </div>

                {/* Grade de Imagens */}
                {formState.images.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-[#DCDCDC] rounded-[4px] text-center bg-[#FAFAFA]">
                    <ImageIcon className="w-8 h-8 text-[#999999] mx-auto mb-2" />
                    <p className="text-xs text-[#555555] font-medium">
                      Nenhuma imagem enviada ainda. Clique no botão acima para adicionar fotos do produto.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {formState.images.map((imgUrl, idx) => (
                      <div
                        key={imgUrl + idx}
                        className="relative rounded-[3px] border border-[#E0E0E0] overflow-hidden group bg-white shadow-xs"
                      >
                        <img
                          src={imgUrl}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-28 object-cover"
                        />
                        {idx === 0 ? (
                          <span className="absolute top-1.5 left-1.5 bg-[#0475EE] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                            Principal
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetMainProductImage(idx)}
                            className="absolute top-1.5 left-1.5 bg-black/70 hover:bg-[#0475EE] text-white text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            Tornar Principal
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveProductImage(idx)}
                          aria-label="Remover imagem"
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center cursor-pointer shadow-xs transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ATRIBUTOS DINÂMICOS (CHAVE / VALOR) */}
              <div className="pt-4 border-t border-[#EAEAEA]">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-condensed text-[16px] font-bold uppercase text-[#0A3768]">
                      3. Especificações e Variações Dinâmicas (Chave / Valor)
                    </h3>
                    <p className="text-[11px] text-[#777777]">
                      Crie atributos sob medida para qualquer nicho (ex: Armazenamento, Volume, Cor, Tamanho, Tipo de Pele, Tom).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDynamicSpec}
                    className="h-8 px-3 rounded-[2px] border border-[#0475EE] text-[#0475EE] hover:bg-[#EAF6FC] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Adicionar Especificação / Variação
                  </button>
                </div>

                <div className="space-y-2.5 mt-3">
                  {dynamicSpecs.map((spec, sIdx) => (
                    <div key={spec.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={spec.key}
                        onChange={(e) => handleUpdateDynamicSpec(spec.id, 'key', e.target.value)}
                        placeholder="Nome do Atributo (ex: Volume, RAM, Tamanho, Cor)"
                        className="flex-1 h-9 px-3 rounded-[2px] border border-[#DCDCDC] text-xs focus:outline-none focus:border-[#0475EE]"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => handleUpdateDynamicSpec(spec.id, 'value', e.target.value)}
                        placeholder="Valor (ex: 200ml, 16GB, M, Bege)"
                        className="flex-1 h-9 px-3 rounded-[2px] border border-[#DCDCDC] text-xs focus:outline-none focus:border-[#0475EE]"
                      />
                      {dynamicSpecs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDynamicSpec(spec.id)}
                          aria-label="Remover linha"
                          className="p-2 text-[#888888] hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#EAEAEA] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setNewProductOpen(false)}
                  className="h-10 px-5 rounded-full border border-[#DCDCDC] text-xs font-bold uppercase text-[#555555] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Publicar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: IMPORTAÇÃO EM MASSA VIA CSV */}
      {csvModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="csv-modal-title"
        >
          <div className="bg-white rounded-[4px] border border-[#E0E0E0] max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#F1F2F4] border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-[#0475EE]" />
                <div>
                  <h2
                    id="csv-modal-title"
                    className="font-condensed text-[20px] font-bold uppercase text-[#0A3768]"
                  >
                    Importar Produtos em Massa via CSV
                  </h2>
                  <p className="text-xs text-[#666666]">
                    Cadastre múltiplos produtos de uma só vez utilizando um arquivo de planilha (.csv).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCsvModalOpen(false)}
                aria-label="Fechar modal de importação"
                className="p-1.5 rounded-[2px] text-[#666666] hover:bg-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              {/* Botão Baixar Modelo */}
              <div className="p-4 rounded-[4px] bg-[#F0F7FF] border border-[#CCE3FF] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-[#0A3768] uppercase tracking-wider">
                    Modelo Padrão da Planilha
                  </h4>
                  <p className="text-xs text-[#444444] mt-0.5 max-w-md">
                    Baixe o arquivo de exemplo pronto com as colunas certas e preencha no Excel ou Google Planilhas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="h-9 px-4 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  Baixar Modelo CSV (.csv)
                </button>
              </div>

              {/* Seletor do arquivo */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#444444]">
                  Selecione o arquivo CSV preenchido no seu computador:
                </label>
                <div className="flex items-center gap-3">
                  <label className="h-10 px-5 rounded-[2px] border border-[#0475EE] text-[#0475EE] hover:bg-[#EAF6FC] text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    Escolher Arquivo CSV
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleCsvFileSelected}
                      className="sr-only"
                    />
                  </label>
                  <span className="text-xs text-[#666666] font-mono truncate max-w-md">
                    {csvFileName || 'Nenhum arquivo selecionado'}
                  </span>
                </div>
              </div>

              {/* Pré-visualização dos itens analisados */}
              {csvParsedItems.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-[#EAEAEA]">
                  <div className="flex items-center justify-between">
                    <h4 className="font-condensed text-[16px] font-bold uppercase text-[#0A3768]">
                      Pré-visualização dos Produtos Identificados
                    </h4>
                    <div className="flex items-center gap-3 text-xs font-bold">
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {csvParsedItems.filter((i) => i.isValid).length} Válidos
                      </span>
                      {csvParsedItems.filter((i) => !i.isValid).length > 0 && (
                        <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {csvParsedItems.filter((i) => !i.isValid).length} com Erro
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto border border-[#E0E0E0] rounded-[2px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8F9FA] border-b border-[#E0E0E0] text-[#555555] uppercase sticky top-0">
                        <tr>
                          <th className="py-2 px-3 font-bold">Linha</th>
                          <th className="py-2 px-3 font-bold">Título</th>
                          <th className="py-2 px-3 font-bold">Categoria</th>
                          <th className="py-2 px-3 font-bold text-right">Preço</th>
                          <th className="py-2 px-3 font-bold text-right">Estoque</th>
                          <th className="py-2 px-3 font-bold text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAEAEA]">
                        {csvParsedItems.map((item) => (
                          <tr
                            key={item.rowNum}
                            className={item.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}
                          >
                            <td className="py-2 px-3 font-mono text-[#777777]">{item.rowNum}</td>
                            <td className="py-2 px-3 font-medium text-[#222222] max-w-[200px] truncate">
                              {item.title || '<Sem Título>'}
                            </td>
                            <td className="py-2 px-3 text-[#555555]">{item.category}</td>
                            <td className="py-2 px-3 font-mono text-right text-[#222222]">
                              {formatCurrency(item.price || 0)}
                            </td>
                            <td className="py-2 px-3 font-mono text-right text-[#555555]">
                              {item.stock}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {item.isValid ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                  <Check className="w-3.5 h-3.5" /> Pronto
                                </span>
                              ) : (
                                <span
                                  title={item.errors.join(', ')}
                                  className="inline-flex items-center gap-1 text-rose-600 font-bold"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" /> {item.errors[0]}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-[#F8F9FA] border-t border-[#E5E7EB] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCsvModalOpen(false)}
                className="h-10 px-5 rounded-full border border-[#DCDCDC] text-xs font-bold uppercase text-[#555555] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={csvImporting || csvParsedItems.filter((i) => i.isValid).length === 0}
                onClick={handleImportParsedCsv}
                className="h-10 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {csvImporting
                  ? 'Importando...'
                  : `Importar ${csvParsedItems.filter((i) => i.isValid).length} Produto(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUBMETER KYC */}
      {kycModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-white rounded-[4px] max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0475EE]" />
                <h3 className="font-condensed text-xl font-bold uppercase text-[#0A3768]">
                  Verificação de Identidade (KYC)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setKycModalOpen(false)}
                className="text-[#777777] hover:text-[#222222] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#666666] leading-relaxed">
              Para validar sua loja como parceira oficial CellBox em Moçambique, informe o documento oficial de identificação do titular ou representante legal.
            </p>

            <form onSubmit={handleSubmitKyc} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#444444] mb-1">
                  Tipo de Documento *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'BI' as const, label: 'B.I.' },
                    { id: 'NUIT' as const, label: 'NUIT' },
                    { id: 'Passaporte' as const, label: 'Passaporte' },
                    { id: 'Alvara' as const, label: 'Alvará' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setKycDocType(t.id)}
                      className={`h-9 rounded-[3px] text-xs font-bold border transition-colors cursor-pointer ${
                        kycDocType === t.id
                          ? 'border-[#0475EE] bg-[#0475EE]/10 text-[#0475EE]'
                          : 'border-[#DCDCDC] text-[#555555] hover:bg-[#F8F9FA]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="kyc-doc-number" className="block text-xs font-bold text-[#444444] mb-1">
                  Número do Documento *
                </label>
                <input
                  id="kyc-doc-number"
                  type="text"
                  required
                  value={kycDocNumber}
                  onChange={(e) => setKycDocNumber(e.target.value)}
                  placeholder="Ex: 110100234567M ou NUIT"
                  className="w-full h-10 px-3 rounded-[3px] border border-[#DCDCDC] text-sm focus:border-[#0475EE] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="kyc-full-name" className="block text-xs font-bold text-[#444444] mb-1">
                  Nome Completo no Documento *
                </label>
                <input
                  id="kyc-full-name"
                  type="text"
                  required
                  value={kycFullName}
                  onChange={(e) => setKycFullName(e.target.value)}
                  placeholder="Nome do titular como consta no documento"
                  className="w-full h-10 px-3 rounded-[3px] border border-[#DCDCDC] text-sm focus:border-[#0475EE] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#444444] mb-1">
                    Foto da Frente do Documento *
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="h-10 px-4 rounded-[3px] border border-[#DCDCDC] hover:border-[#0475EE] bg-[#F9FAFB] text-xs font-bold text-[#333333] inline-flex items-center gap-2 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-[#0475EE]" />
                      {uploadingKycDoc ? 'Carregando...' : 'Carregar Frente'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadKycDoc}
                        className="hidden"
                        disabled={uploadingKycDoc}
                      />
                    </label>
                    {kycDocFrontUrl && (
                      <span className="text-xs text-emerald-600 font-semibold inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Anexado
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#444444] mb-1">
                    Foto do Verso do Documento (Opcional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="h-10 px-4 rounded-[3px] border border-[#DCDCDC] hover:border-[#0475EE] bg-[#F9FAFB] text-xs font-bold text-[#333333] inline-flex items-center gap-2 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-[#0475EE]" />
                      {uploadingKycDocBack ? 'Carregando...' : 'Carregar Verso'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadKycDocBack}
                        className="hidden"
                        disabled={uploadingKycDocBack}
                      />
                    </label>
                    {kycDocBackUrl && (
                      <span className="text-xs text-emerald-600 font-semibold inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Anexado
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EAEAEA] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setKycModalOpen(false)}
                  className="h-9 px-4 rounded-full border border-[#DCDCDC] text-xs font-bold uppercase text-[#555555] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingKyc || !kycDocNumber.trim() || !kycFullName.trim()}
                  className="h-9 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  {submittingKyc ? 'Submetendo...' : 'Submeter Documentos para Análise'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PAGAR TAXA DE INSCRIÇÃO (100 MZN REAL) */}
      {feeModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-[4px] max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#E50914]" />
                <h3 className="font-condensed text-xl font-bold uppercase text-[#0A3768]">
                  Taxa de Ativação de Loja (100,00 MT)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFeeModalOpen(false)}
                className="text-[#777777] hover:text-[#222222] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* OPÇÃO 1: PAGAMENTO AUTOMÁTICO ESCALEPAY */}
            {siteCustomization?.gateways?.escalePayCheckoutUrl?.trim() ? (
              <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-[4px] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="font-bold text-[#166534] text-xs uppercase tracking-wider">
                      Recomendado · Ativação Instantânea
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                    EscalePay
                  </span>
                </div>
                <p className="text-xs text-[#14532D] leading-relaxed">
                  Pague com <strong>M-Pesa, e-Mola ou Cartão</strong> no checkout oficial da EscalePay. Assim que concluir o pagamento, a CellBox recebe o sinal do Webhook e aprova a taxa da sua loja automaticamente!
                </p>
                <a
                  href={(() => {
                    const base = siteCustomization.gateways?.escalePayCheckoutUrl?.trim() || '';
                    if (!base) return '#';
                    try {
                      const u = new URL(base);
                      u.searchParams.set('sellerId', seller?.id || '');
                      u.searchParams.set('reference', seller?.id || '');
                      u.searchParams.set('name', currentUser?.name || seller?.name || '');
                      if (currentUser?.email) u.searchParams.set('email', currentUser.email);
                      if (feePhone || currentUser?.phone) u.searchParams.set('phone', feePhone || currentUser?.phone || '');
                      return u.toString();
                    } catch {
                      const sep = base.includes('?') ? '&' : '?';
                      return `${base}${sep}sellerId=${encodeURIComponent(seller?.id || '')}&reference=${encodeURIComponent(seller?.id || '')}&phone=${encodeURIComponent(feePhone || currentUser?.phone || '')}`;
                    }
                  })()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 px-4 rounded-[3px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  Ir para Checkout EscalePay (100 MT)
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : null}

            {/* SEPARADOR OU OPÇÃO MANUAL */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#EAEAEA]"></div>
              <span className="flex-shrink mx-3 text-[11px] font-bold uppercase text-[#888888]">
                {siteCustomization?.gateways?.escalePayCheckoutUrl?.trim()
                  ? 'Ou pague por transferência manual'
                  : 'Pagamento via Transferência Móvel'}
              </span>
              <div className="flex-grow border-t border-[#EAEAEA]"></div>
            </div>

            {/* INSTRUÇÕES OFICIAIS DE PAGAMENTO EM MOÇAMBIQUE */}
            <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-[3px] p-3.5 space-y-2 text-xs">
              <p className="font-bold text-[#0A3768] uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0475EE]" />
                Contas Oficiais CellBox Moçambique para Transferência
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded border border-[#E2E8F0]">
                  <p className="text-[10px] font-bold text-[#E50914] uppercase">Vodacom M-Pesa</p>
                  <p className="text-sm font-bold text-[#1E293B] font-mono mt-0.5">869391382</p>
                  <p className="text-[10px] text-[#64748B]">Nome: CellBox / Joswil</p>
                </div>
                <div className="bg-white p-2.5 rounded border border-[#E2E8F0]">
                  <p className="text-[10px] font-bold text-[#F58220] uppercase">Movitel e-Mola</p>
                  <p className="text-sm font-bold text-[#1E293B] font-mono mt-0.5">869391382</p>
                  <p className="text-[10px] text-[#64748B]">Nome: CellBox / Joswil</p>
                </div>
              </div>
              <p className="text-[11px] text-[#475569] leading-relaxed pt-1">
                Efetue a transferência de <strong>100 MT</strong>. Em seguida, informe abaixo o número que transferiu, o <strong>ID da Transação</strong> recebido no SMS da operadora e anexe o comprovante.
              </p>
            </div>

            <form onSubmit={handlePayFee} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#444444] mb-1.5">
                  Carteira Móvel Utilizada *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFeeMethod('mpesa')}
                    className={`p-2.5 rounded-[3px] border text-left transition-all cursor-pointer ${
                      feeMethod === 'mpesa'
                        ? 'border-[#E50914] bg-[#E50914]/5 ring-1 ring-[#E50914]'
                        : 'border-[#DCDCDC] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#E50914]">M-Pesa (Vodacom)</span>
                      <span className="w-3.5 h-3.5 rounded-full border border-[#E50914] flex items-center justify-center">
                        {feeMethod === 'mpesa' && <span className="w-2 h-2 rounded-full bg-[#E50914]" />}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeeMethod('emola')}
                    className={`p-2.5 rounded-[3px] border text-left transition-all cursor-pointer ${
                      feeMethod === 'emola'
                        ? 'border-[#F58220] bg-[#F58220]/5 ring-1 ring-[#F58220]'
                        : 'border-[#DCDCDC] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#F58220]">e-Mola (Movitel)</span>
                      <span className="w-3.5 h-3.5 rounded-full border border-[#F58220] flex items-center justify-center">
                        {feeMethod === 'emola' && <span className="w-2 h-2 rounded-full bg-[#F58220]" />}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="fee-phone" className="block text-xs font-bold text-[#444444] mb-1">
                  Número de Celular que Transferiu *
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="fee-phone"
                    type="tel"
                    required
                    value={feePhone}
                    onChange={(e) => setFeePhone(e.target.value)}
                    placeholder={feeMethod === 'mpesa' ? '84 123 4567' : '86 123 4567'}
                    className="w-full h-10 pl-9 pr-3 rounded-[3px] border border-[#DCDCDC] text-sm focus:border-[#0475EE] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="fee-tx-id" className="block text-xs font-bold text-[#444444] mb-1">
                  Código / ID da Transação no SMS *
                </label>
                <input
                  id="fee-tx-id"
                  type="text"
                  required
                  value={feeTransactionId}
                  onChange={(e) => setFeeTransactionId(e.target.value)}
                  placeholder="Ex: PP261124.1624.A12345 ou 2K38X99A"
                  className="w-full h-10 px-3 rounded-[3px] border border-[#DCDCDC] text-sm font-mono uppercase focus:border-[#0475EE] focus:outline-none"
                />
                <p className="text-[11px] text-[#777777] mt-1">
                  Insira o código de confirmação recebido por SMS da Vodacom ou Movitel.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444444] mb-1">
                  Foto do Comprovante / Screenshot do SMS (Opcional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="h-9 px-3 rounded-[3px] border border-[#DCDCDC] hover:border-[#0475EE] bg-[#F9FAFB] text-xs font-bold text-[#333333] inline-flex items-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#0475EE]" />
                    {uploadingFeeProof ? 'Carregando...' : 'Anexar Comprovante'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadFeeProof}
                      className="hidden"
                      disabled={uploadingFeeProof}
                    />
                  </label>
                  {feeProofUrl && (
                    <span className="text-xs text-emerald-600 font-semibold inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Anexado
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFeeModalOpen(false)}
                  className="h-9 px-4 rounded-full border border-[#DCDCDC] text-xs font-bold uppercase text-[#555555] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={payingFee || !feePhone.trim() || !feeTransactionId.trim()}
                  className="h-9 px-6 rounded-full bg-[#E50914] hover:bg-[#c20811] text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                >
                  {payingFee ? (
                    'Enviando...'
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Submeter Transação para Validação
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE SOLICITAÇÃO DE SAQUE (MODO A) */}
      {payoutModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-payout-title"
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-[4px] border border-[#EAEAEA] w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#0A3768] text-white flex items-center justify-between">
              <div>
                <h3 id="modal-payout-title" className="font-condensed text-xl font-bold uppercase">
                  Solicitar Saque de Repasse
                </h3>
                <p className="text-xs text-white/80">
                  Saldo líquido liberado: {formatCurrency(analytics.availableBalance)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPayoutModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/15 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestPayout} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {payoutFormError && (
                <div className="p-3 rounded-[3px] bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                  {payoutFormError}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="payout-amount-input" className="text-xs font-bold text-[#333333]">
                    Valor do Saque (MT) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setPayoutAmount(analytics.availableBalance.toFixed(2))}
                    className="text-[11px] font-bold text-[#0475EE] hover:underline cursor-pointer"
                  >
                    Usar saldo total ({formatCurrency(analytics.availableBalance)})
                  </button>
                </div>
                <input
                  id="payout-amount-input"
                  type="number"
                  step="0.01"
                  min="1"
                  max={analytics.availableBalance}
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full h-11 px-3 rounded-[2px] border border-[#DCDCDC] text-base font-mono font-bold focus:outline-none focus:border-[#0475EE]"
                />
              </div>

              <div>
                <span className="block text-xs font-bold text-[#333333] mb-1.5">
                  Canal de Recebimento *
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'mpesa', label: 'M-Pesa' },
                      { id: 'emola', label: 'e-Mola' },
                      { id: 'bank_transfer', label: 'Banco (NIB)' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayoutMethod(m.id)}
                      className={`h-9 rounded-[2px] border text-xs font-bold uppercase cursor-pointer transition-colors ${
                        payoutMethod === m.id
                          ? 'bg-[#0475EE] border-[#0475EE] text-white'
                          : 'bg-white border-[#DCDCDC] text-[#444444] hover:border-[#0475EE]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="payout-holder-input" className="block text-xs font-bold text-[#333333] mb-1">
                  Nome Completo do Titular *
                </label>
                <input
                  id="payout-holder-input"
                  type="text"
                  required
                  value={payoutAccountHolder}
                  onChange={(e) => setPayoutAccountHolder(e.target.value)}
                  placeholder="Nome conforme registrado na carteira/banco"
                  className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                />
              </div>

              {payoutMethod === 'mpesa' || payoutMethod === 'emola' ? (
                <div>
                  <label htmlFor="payout-wallet-phone" className="block text-xs font-bold text-[#333333] mb-1">
                    Número {payoutMethod === 'mpesa' ? 'M-Pesa' : 'e-Mola'} *
                  </label>
                  <input
                    id="payout-wallet-phone"
                    type="tel"
                    required
                    value={payoutWalletPhone}
                    onChange={(e) => setPayoutWalletPhone(e.target.value)}
                    placeholder="Ex: 84 123 4567"
                    className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm font-mono"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="payout-bank-name" className="block text-xs font-bold text-[#333333] mb-1">
                      Banco *
                    </label>
                    <input
                      id="payout-bank-name"
                      type="text"
                      required
                      value={payoutBankName}
                      onChange={(e) => setPayoutBankName(e.target.value)}
                      placeholder="Ex: Millennium BIM, BCI"
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="payout-bank-acc" className="block text-xs font-bold text-[#333333] mb-1">
                      NIB / Número da Conta *
                    </label>
                    <input
                      id="payout-bank-acc"
                      type="text"
                      required
                      value={payoutAccountNumber}
                      onChange={(e) => setPayoutAccountNumber(e.target.value)}
                      placeholder="21 dígitos do NIB"
                      className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="payout-notes" className="block text-xs font-bold text-[#333333] mb-1">
                  Observações para o Financeiro (opcional)
                </label>
                <input
                  id="payout-notes"
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="Ex: Referente às vendas da semana"
                  className="w-full h-10 px-3 rounded-[2px] border border-[#DCDCDC] text-sm"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-[#444444] cursor-pointer">
                <input
                  type="checkbox"
                  checked={savePayoutDefaults}
                  onChange={(e) => setSavePayoutDefaults(e.target.checked)}
                />
                Salvar estes dados como padrão para próximos repasses
              </label>

              <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPayoutModalOpen(false)}
                  className="h-9 px-4 rounded-full border border-[#DCDCDC] text-xs font-bold uppercase text-[#555555] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout}
                  className="h-9 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                >
                  {submittingPayout ? 'Enviando...' : 'Confirmar Solicitação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
