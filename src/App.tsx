import { useEffect } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { LogOut, ShieldCheck, Store } from 'lucide-react';
import { MarketplaceProvider, useMarketplace } from './context/MarketplaceContext';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { AboutView } from './components/AboutView';
import { StoresView } from './components/StoresView';
import { OffersView } from './components/OffersView';
import { ContactView } from './components/ContactView';
import { ProductDetailView } from './components/ProductDetailView';
import { SellerStoreView } from './components/SellerStoreView';
import { CartCheckoutView } from './components/CartCheckoutView';
import { BuyerProfileView } from './components/BuyerProfileView';
import { AuthView } from './components/AuthView';
import { PasswordRecoveryView } from './components/PasswordRecoveryView';
import { SellerDashboardView } from './components/SellerDashboardView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { CompareModal } from './components/CompareModal';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';
import { MotionButton } from './components/MotionPrimitives';

function AdminIsolatedShell() {
  const { view, currentUser, logout, navigate, siteCustomization } = useMarketplace();
  if (!currentUser || currentUser.role !== 'admin') return null;

  const brandLogo = siteCustomization?.theme?.logoUrl?.trim() || '/assets/aistudio/CellBox_9c0f59ac.png';

  return (
    <div
      data-testid="isolated-admin-shell"
      className="min-h-screen flex flex-col bg-[#F5F7FA] text-[#333333]"
    >
      <header
        className="sticky top-0 z-50 text-white border-b border-white/10 shadow-sm"
        style={{ backgroundColor: siteCustomization?.theme?.navyColor || '#0A3768' }}
      >
        <div className="max-w-[1170px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-[3px] px-2.5 py-1 flex items-center">
              <img
                src={brandLogo}
                alt="Cellbox"
                className="h-7 w-auto object-contain"
              />
            </div>
            <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-white/20">
              <ShieldCheck className="w-4 h-4 text-[#1AD6DE]" />
              <span className="font-condensed text-sm font-bold uppercase tracking-wider text-white">
                Painel Administrativo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block leading-tight">
              <p className="text-xs font-bold text-white">{currentUser.name}</p>
              <p className="text-[11px] text-white/75">{currentUser.email}</p>
            </div>
            <MotionButton
              type="button"
              data-testid="admin-view-public-store-btn"
              onClick={() => navigate({ type: 'home' })}
              className="h-9 px-4 rounded-full bg-white text-[#0A3768] hover:bg-[#EAF6FC] text-xs font-bold uppercase tracking-wide inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              Ver Loja Pública
            </MotionButton>
            <MotionButton
              type="button"
              data-testid="admin-logout-btn"
              onClick={() => void logout()}
              className="h-9 px-4 rounded-full bg-white/15 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wide inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </MotionButton>
          </div>
        </div>
      </header>

      <div className="flex-1">
        <AdminDashboardView
          initialTab={view.type === 'admin_dashboard' ? view.tab : 'overview'}
        />
      </div>

      <Toast />
    </div>
  );
}

function CellboxShell() {
  const { view, authReady, currentUser, siteCustomization } = useMarketplace();

  useEffect(() => {
    const theme = siteCustomization?.theme;
    if (!theme) return;
    const root = document.documentElement;
    if (theme.primaryColor) root.style.setProperty('--color-brand-royal', theme.primaryColor);
    if (theme.navyColor) root.style.setProperty('--color-brand-navy', theme.navyColor);
    if (theme.accentColor) root.style.setProperty('--color-brand-cyan', theme.accentColor);
    if (theme.highlightColor) root.style.setProperty('--color-brand-aqua', theme.highlightColor);
    if (theme.surfaceColor) root.style.setProperty('--color-brand-tint', theme.surfaceColor);

    if (theme.faviconUrl?.trim()) {
      const href = theme.faviconUrl.trim();
      const selectors = ['link[rel="icon"]', 'link[rel="shortcut icon"]', 'link[rel="apple-touch-icon"]'];
      selectors.forEach((sel) => {
        const el = document.querySelector<HTMLLinkElement>(sel);
        if (el) el.href = href;
      });
    }
  }, [siteCustomization?.theme]);

  const isProtectedRoute =
    view.type === 'profile' ||
    view.type === 'seller_dashboard' ||
    view.type === 'admin_dashboard';

  // Wait for real session check before rendering protected routes (prevents flash)
  if (!authReady && isProtectedRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-[#0A3768] text-xs font-semibold uppercase tracking-wider">
        Verificando sessão...
      </div>
    );
  }

  // Admin gets a completely separate, isolated workspace shell
  if (view.type === 'admin_dashboard' && currentUser?.role === 'admin') {
    return <AdminIsolatedShell />;
  }

  const viewKey =
    view.type === 'product'
      ? `product-${view.productId}`
      : view.type === 'store'
        ? `store-${view.sellerId}`
        : view.type;

  const renderView = () => {
    switch (view.type) {
      case 'home':
        return <HomeView />;
      case 'about':
        return <AboutView />;
      case 'stores':
        return <StoresView />;
      case 'offers':
        return <OffersView />;
      case 'contact':
        return <ContactView />;
      case 'product':
        return <ProductDetailView productId={view.productId} />;
      case 'store':
        return <SellerStoreView sellerId={view.sellerId} />;
      case 'cart':
        return !currentUser || currentUser.role === 'buyer' ? <CartCheckoutView /> : <HomeView />;
      case 'profile':
        return currentUser?.role === 'buyer' ? (
          <BuyerProfileView initialTab={view.tab} />
        ) : (
          <AuthView initialMode="login" />
        );
      case 'auth':
        return <AuthView initialMode={view.mode} />;
      case 'forgot_password':
        return <PasswordRecoveryView mode="forgot" />;
      case 'reset_password':
        return <PasswordRecoveryView mode="reset" token={view.token} />;
      case 'seller_dashboard':
        return currentUser?.role === 'seller' ? (
          <SellerDashboardView initialTab={view.tab} />
        ) : (
          <AuthView initialMode="login" />
        );
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#333333]">
      <Navbar />
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>
      <Footer />
      <CompareModal />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <MarketplaceProvider>
        <CellboxShell />
      </MarketplaceProvider>
    </MotionConfig>
  );
}
