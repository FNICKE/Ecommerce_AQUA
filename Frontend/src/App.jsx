import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuthStore } from "./store/authStore";
import { useThemeStore } from "./store/themeStore";
import { Menu, Bell, User, LogOut, Loader2 } from "lucide-react";
import ToastContainer from "./components/ToastContainer";
import ScrollToTop from "./components/ScrollToTop";
import api from "./lib/api";

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import About from "./pages/About";
import ContactUs from "./pages/Contact";
import TopOffers from "./pages/TopOffers";
import PublicCategories from "./pages/Categories";
import Category from "./pages/Category";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";
import MyOrders from "./pages/MyOrders";
import Addresses from "./pages/Addresses";
import Wishlist from "./pages/Wishlist";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminCategories from "./pages/Admin/categories/Categories";
import CategoriesOrder from "./pages/Admin/categories/Categories-Order";
import Brands from "./pages/Admin/Brands";
import Orders from "./pages/Admin/orders/Orders";
import OrderTracking from "./pages/Admin/orders/Order-Tracking";
import SystemNotification from "./pages/Admin/orders/System-notification";
import PointOfSale from "./pages/Admin/Point-Of-Sale";
import Media from "./pages/Admin/Media";
import Sliders from "./pages/Admin/Sliders";
import Offer from "./pages/Admin/offer/Offer";
import OfferSlider from "./pages/Admin/offer/Offer-slider";
import Feature from "./pages/Admin/featured-sections/ManageFeature";
import SectionsOrder from "./pages/Admin/featured-sections/Sections-order";
import AddProduct from "./pages/Admin/products/Add-Product";
import Attribute from "./pages/Admin/products/Attribute";
import BulkUpload from "./pages/Admin/products/Bulk-upload";
import ManageProducts from "./pages/Admin/products/Manage-Products";
import EditProduct from "./pages/Admin/products/Edit-Product";
import ProductsFAQs from "./pages/Admin/products/Products-FAQs";
import ProductsOrder from "./pages/Admin/products/Products-Order";
import Taxes from "./pages/Admin/products/Taxes";
import System from "./pages/Admin/system/System";
import SystemUsers from "./pages/Admin/System-Users";
import HomePageManager from "./pages/Admin/HomePageManager";
import ProductStock from "./pages/Admin/Product-Stock";
import PromoCodes from "./pages/Admin/PromoCodes";
import StoreSetting from "./pages/Admin/system/StoreSetting";
import PaymentMethods from "./pages/Admin/system/PaymentMethods";
import RazorpayPaymentLogs from "./pages/Admin/system/RazorpayPaymentLogs";
import PayuPaymentLogs from "./pages/Admin/system/PayuPaymentLogs";
import NotificationSettings from "./pages/Admin/system/NotificationSettings";
import ShippingMethod from "./pages/Admin/system/ShippingMethod";
import AboutEditor from "./pages/Admin/AboutEditor";
import ContactEditor from "./pages/Admin/ContactEditor";
import PrivacyPolicy from "./pages/LegalPolicy";
import TermsConditions from "./pages/TermsConditions";
import ReturnPolicy from "./pages/ReturnPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import PrivacyPolicyEditor from "./pages/Admin/PrivacyPolicyEditor";
import TermsConditionsEditor from "./pages/Admin/TermsConditionsEditor";
import ReturnPolicyEditor from "./pages/Admin/ReturnPolicyEditor";
import ShippingPolicyEditor from "./pages/Admin/ShippingPolicyEditor";
import WebSettings from "./pages/Admin/system/WebSettings";
import GeneralSettings from "./pages/Admin/system/GeneralSettings";
import ThemeSettings from "./pages/Admin/system/ThemeSettings";
import LanguageSettings from "./pages/Admin/system/LanguageSettings";
import FirebaseSettings from "./pages/Admin/system/FirebaseSettings";
import SalesReport from "./pages/Admin/SalesReport";
import InventoryReport from "./pages/Admin/InventoryReport";
import ReviewSettings from "./pages/Admin/system/ReviewSettings";
import BlogsSettings from "./pages/Admin/system/BlogsSettings";

function adjustColorBrightness(hex, percent) {
  if (!hex || hex.trim() === '') return '';
  let num = parseInt(hex.replace("#",""), 16),
  amt = Math.round(2.55 * percent),
  R = (num >> 16) + amt,
  G = (num >> 8 & 0x00FF) + amt,
  B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R<255?R<0?0:R:255)*0x10000 + (G<255?G<0?0:G:255)*0x100 + (B<255?B<0?0:B:255)).toString(16).slice(1);
}

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const { logout, isAuthenticated, user } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
  }, []);

  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      setIsCheckingAuth(false);
    };
    init();
  }, [initializeAuth]);

  useEffect(() => {
    const fetchAndApplyTheme = async () => {
      try {
        const res = await api.get('/config/public');
        const primary = res.data.theme_classic_primary_color;
        const secondary = res.data.theme_classic_secondary_color;
        const font = res.data.theme_classic_font_color;
        const favicon = res.data.favicon_url;
        const root = document.documentElement;

        if (res.data.site_title || res.data.site_name) {
          window.siteTitle = res.data.site_title || 'The Aqua Machine';
          window.siteName = res.data.site_name || 'The Aqua Machine';
          window.metaKeywords = res.data.meta_keywords || '';
          window.metaDescription = res.data.meta_description || '';
          window.dispatchEvent(new Event('siteTitleLoaded'));
        }

        if (primary && primary.trim() !== '') {
          root.style.setProperty('--primary', primary);
          root.style.setProperty('--primary-dark', adjustColorBrightness(primary, -15));
          root.style.setProperty('--primary-light', adjustColorBrightness(primary, 40));
        }
        if (secondary && secondary.trim() !== '') {
          root.style.setProperty('--secondary', secondary);
        }
        if (font && font.trim() !== '') {
          root.style.setProperty('--text-primary', font);
        }
        if (favicon && favicon.trim() !== '') {
          const faviconUrl = favicon.startsWith('/')
            ? `${api.defaults.baseURL?.replace('/api', '') || ''}${favicon}`
            : favicon;
          let faviconLink = document.querySelector("link[rel~='icon']");
          if (!faviconLink) {
            faviconLink = document.createElement('link');
            faviconLink.rel = 'icon';
            document.head.appendChild(faviconLink);
          }
          faviconLink.href = faviconUrl;
        }
      } catch (err) {
        console.warn('Failed to load dynamic theme settings:', err);
      }
    };
    fetchAndApplyTheme();
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Loading your session...</p>
      </div>
    );
  }

  const isAdmin = isAuthenticated && user?.company === "ADMIN";
  const renderAdminShell = (content = <Outlet />) => (
    <div className="admin-layout flex h-screen bg-gray-50 overflow-hidden">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed md:relative z-50 md:z-auto h-full transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <Sidebar isSidebarOpen={true} onClose={() => setIsSidebarOpen(false)} />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white h-14 md:h-16 flex items-center justify-between px-4 md:px-8 shadow-sm shrink-0 z-20 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Menu size={20} />
            </button>
            <span className="bg-purple-600 text-white text-[10px] md:text-xs px-2 md:px-2.5 py-1 rounded font-bold uppercase tracking-wider">
              Admin Panel
            </span>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="relative cursor-pointer hover:text-purple-600 transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                0
              </span>
            </div>
            <div className="flex items-center gap-2 md:gap-3 border-l pl-3 md:pl-6">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">
                <User size={18} />
              </div>
              <button
                onClick={logout}
                className="text-slate-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-8">{content}</div>
      </main>
    </div>
  );

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <ToastContainer />
      <Routes>
        <Route
          element={
            <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden w-full">
              <Navbar />
              <main className="flex-grow overflow-x-hidden w-full">
                <Outlet />
              </main>
              <Footer />
            </div>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login mode="user" />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/offers" element={<TopOffers />} />
          <Route path="/category" element={<PublicCategories />} />
          <Route path="/category/:id" element={<Category />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/return-policy" element={<ReturnPolicy />} />
          <Route path="/returns" element={<ReturnPolicy />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/shipping" element={<ShippingPolicy />} />
          <Route path="/cart" element={<Cart />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/addresses" element={<Addresses />} />
            <Route path="/wishlist" element={<Wishlist />} />
          </Route>
        </Route>

        <Route
          path="/admin"
          element={isAdmin ? renderAdminShell(<AdminDashboard />) : <div className="admin-layout min-h-screen"><Login mode="admin" /></div>}
        />

        <Route element={<ProtectedRoute adminOnly />}>
          <Route element={renderAdminShell()}>
            <Route path="/admin/pos" element={<PointOfSale />} />
            <Route path="/admin/media" element={<Media />} />
            <Route path="/admin/product-stock" element={<ProductStock />} />
            <Route path="/admin/promo-codes" element={<PromoCodes />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/categories-order" element={<CategoriesOrder />} />
            <Route path="/admin/brands" element={<Brands />} />
            <Route path="/admin/feature" element={<Feature />} />
            <Route path="/admin/featured-sections-order" element={<SectionsOrder />} />
            <Route path="/admin/sliders" element={<Sliders />} />
            <Route path="/admin/offer" element={<Offer />} />
            <Route path="/admin/offer-slider" element={<OfferSlider />} />
            <Route path="/admin/orders" element={<Orders />} />
            <Route path="/admin/order-tracking" element={<OrderTracking />} />
            <Route path="/admin/system-notifications" element={<SystemNotification />} />
            <Route path="/admin/attributes" element={<Attribute />} />
            <Route path="/admin/taxes" element={<Taxes />} />
            <Route path="/admin/add-product" element={<AddProduct />} />
            <Route path="/admin/bulk-upload" element={<BulkUpload />} />
            <Route path="/admin/manage-products" element={<ManageProducts />} />
            <Route path="/admin/edit-product/:id" element={<EditProduct />} />
            <Route path="/admin/product-faqs" element={<ProductsFAQs />} />
            <Route path="/admin/products-order" element={<ProductsOrder />} />
            <Route path="/admin/system" element={<System />} />
            <Route path="/admin/review-settings" element={<ReviewSettings />} />
            <Route path="/admin/blogs-settings" element={<BlogsSettings />} />
            <Route path="/admin/system-users" element={<SystemUsers />} />
            <Route path="/admin/home-page" element={<HomePageManager />} />
            <Route path="/admin/store-setting" element={<StoreSetting />} />
            <Route path="/admin/payment-methods" element={<PaymentMethods />} />
            <Route path="/admin/razorpay-payment-logs" element={<RazorpayPaymentLogs />} />
            <Route path="/admin/payu-payment-logs" element={<PayuPaymentLogs />} />
            <Route path="/admin/email-settings" element={<NotificationSettings />} />
            <Route path="/admin/notification-settings" element={<NotificationSettings />} />
            <Route path="/admin/shipping-methods" element={<ShippingMethod />} />
            <Route path="/admin/about-editor" element={<AboutEditor />} />
            <Route path="/admin/contact-editor" element={<ContactEditor />} />
            <Route path="/admin/privacy-policy" element={<PrivacyPolicyEditor />} />
            <Route path="/admin/terms-conditions" element={<TermsConditionsEditor />} />
            <Route path="/admin/return-policy" element={<ReturnPolicyEditor />} />
            <Route path="/admin/shipping-policy" element={<ShippingPolicyEditor />} />
            <Route path="/admin/web-settings" element={<WebSettings />} />
            <Route path="/admin/general-settings" element={<GeneralSettings />} />
            <Route path="/admin/theme-settings" element={<ThemeSettings />} />
            <Route path="/admin/language-settings" element={<LanguageSettings />} />
            <Route path="/admin/firebase-settings" element={<FirebaseSettings />} />
            <Route path="/admin/sales-report" element={<SalesReport />} />
            <Route path="/admin/inventory-report" element={<InventoryReport />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
