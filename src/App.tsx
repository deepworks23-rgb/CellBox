import { MarketplaceProvider, useMarketplace } from './context/MarketplaceContext';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { ProductDetailView } from './components/ProductDetailView';
import { SellerStoreView } from './components/SellerStoreView';
import { CartCheckoutView } from './components/CartCheckoutView';
import { BuyerProfileView } from './components/BuyerProfileView';
import { AuthView } from './components/AuthView';
import { SellerDashboardView } from './components/SellerDashboardView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { CompareModal } from './components/CompareModal';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';

function CellboxShell() {
  const { view } = useMarketplace();

  const renderView = () => {
    switch (view.type) {
      case 'home':
        return <HomeView />;
      case 'product':
        return <ProductDetailView productId={view.productId} />;
      case 'store':
        return <SellerStoreView sellerId={view.sellerId} />;
      case 'cart':
        return <CartCheckoutView />;
      case 'profile':
        return <BuyerProfileView initialTab={view.tab} />;
      case 'auth':
        return <AuthView initialMode={view.mode} />;
      case 'seller_dashboard':
        return <SellerDashboardView initialTab={view.tab} />;
      case 'admin_dashboard':
        return <AdminDashboardView initialTab={view.tab} />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#333333]">
      <Navbar />
      <div className="flex-1">{renderView()}</div>
      <Footer />
      <CompareModal />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <MarketplaceProvider>
      <CellboxShell />
    </MarketplaceProvider>
  );
}
