import { Routes, Route } from "react-router-dom";
import { lazy } from "react";
import Navbar from "./components/Navbar";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import SellerLayout from "./components/seller/SellerLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import './App.css';
import Footer from "./components/Footer";
import AdminRoute from "./components/AdminRoute";
import ToastProvider from "./components/ToastProvider";
import AdminAuctions from "./components/admin/AdminAuctions";
import AboutUs from "./components/AboutUs";
import ScrollToTop from "./components/ScrollToTop";
import Canonical from "./components/Canonical";
import { useSettings } from "./context/SettingsContext";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Auctions = lazy(() => import("./pages/Auctions"));
const AuctionDetails = lazy(() => import("./pages/AuctionDetails"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const SellerWallet = lazy(() => import("./pages/SellerWallet"));
const AddAuction = lazy(() => import("./pages/AddAuction"));
const EditAuction = lazy(() => import("./pages/EditAuction"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminAddAuction = lazy(() => import("./pages/AdminAddAuction"));
const AdminEditAuction = lazy(() => import("./pages/AdminEditAuction"));
const AdminStats = lazy(() => import("./pages/AdminStats"));
const AdminNotifications = lazy(() => import("./pages/AdminNotifications"));
const AdminWalletApprovals = lazy(() => import("./pages/AdminWalletApprovals"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Profile = lazy(() => import("./pages/Profile"));
const SellerOrders = lazy(() => import("./pages/SellerOrders"));
const SellerStats = lazy(() => import("./pages/SellerStats"));
const SellerAddProduct = lazy(() => import("./pages/SellerAddProduct"));
const SellerSettings = lazy(() => import("./pages/SellerSettings"));
const Notifications = lazy(() => import("./pages/Notifications"));
const ChatInbox = lazy(() => import("./pages/ChatInbox"));
const ChatRoom = lazy(() => import("./pages/ChatRoom"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const Reviews = lazy(() => import("./pages/Reviews"));
const AddReview = lazy(() => import("./pages/AddReview"));
const Payment = lazy(() => import("./pages/Payment"));
const SellerJoin = lazy(() => import("./pages/SellerJoin"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const FeatureShowcase = lazy(() => import("./pages/FeatureShowcase"));
const HowSellerWorks = lazy(() => import("./pages/HowSellerWorks"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentStatus = lazy(() => import("./pages/PaymentStatus"));
const SellerKYC = lazy(() => import("./pages/SellerKYC"));
const AdminKYC = lazy(() => import("./pages/AdminKYC"));
const Compare = lazy(() => import("./pages/Compare"));
const SavedSearches = lazy(() => import("./pages/SavedSearches"));
const AdminAuditLogs = lazy(() => import("./pages/AdminAuditLogs"));
const AstralCollections = lazy(() => import("./pages/AstralCollections"));
const TimelessRelics = lazy(() => import("./pages/TimelessRelics"));
const IntergalacticArtifacts = lazy(() => import("./pages/IntergalacticArtifacts"));
const CosmicCurations = lazy(() => import("./pages/CosmicCurations"));
const CommissionInfo = lazy(() => import("./pages/CommissionInfo"));
const ShippingPolicies = lazy(() => import("./pages/ShippingPolicies"));
const SellerRankings = lazy(() => import("./pages/SellerRankings"));
const Support = lazy(() => import("./pages/Support"));
const BuyingGuide = lazy(() => import("./pages/BuyingGuide"));
const BuyerProtection = lazy(() => import("./pages/BuyerProtection"));
const SellerHandbook = lazy(() => import("./pages/SellerHandbook"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const CopyrightIP = lazy(() => import("./pages/CopyrightIP"));
const UserAgreement = lazy(() => import("./pages/UserAgreement"));
const AccessibilityStatement = lazy(() => import("./pages/AccessibilityStatement"));
const Sitemap = lazy(() => import("./pages/Sitemap"));
const RecentlyViewed = lazy(() => import("./pages/RecentlyViewed"));


function App() {
  const { settings } = useSettings();
  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />
      <ToastProvider />
      {settings?.maintenanceMode ? (
        <div className="w-full bg-yellow-600/20 border-y border-yellow-400/30 text-yellow-200 text-center py-2 text-sm">
          Maintenance Mode is active. Some actions are temporarily disabled.
        </div>
      ) : null}

      <ErrorBoundary>
      <ScrollToTop />
      <Canonical />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/support" element={<Support />} />
        <Route path="/help/buying" element={<BuyingGuide />} />
        <Route path="/help/buyer-protection" element={<BuyerProtection />} />
        <Route path="/help/seller-handbook" element={<SellerHandbook />} />
        <Route path="/seller/how-it-works" element={<HowSellerWorks />} />
        {/* Legal & Policies */}
        <Route path="/legal/terms" element={<TermsOfService />} />
        <Route path="/legal/privacy" element={<PrivacyPolicy />} />
        <Route path="/legal/cookies" element={<CookiePolicy />} />
        <Route path="/legal/refunds" element={<RefundPolicy />} />
        <Route path="/legal/copyright" element={<CopyrightIP />} />
        <Route path="/legal/user-agreement" element={<UserAgreement />} />
        <Route path="/legal/accessibility" element={<AccessibilityStatement />} />
        {/* Utilities */}
        <Route path="/sitemap" element={<Sitemap />} />
        <Route path="/recently-viewed" element={<RecentlyViewed />} />
        <Route path="/seller/kyc" element={<ProtectedRoute requiredRole="seller"><SellerKYC /></ProtectedRoute>} />
        <Route path="/admin/kyc" element={<ProtectedRoute requiredRole="admin"><AdminKYC /></ProtectedRoute>} />
        <Route path="/collections/astral" element={<AstralCollections />} />
        <Route path="/collections/timeless-relics" element={<TimelessRelics />} />
        <Route path="/collections/intergalactic-artifacts" element={<IntergalacticArtifacts />} />
        <Route path="/curations/cosmic" element={<CosmicCurations />} />
        <Route path="/seller/commission-info" element={<CommissionInfo />} />
        <Route path="/seller/shipping-policies" element={<ShippingPolicies />} />
        <Route path="/seller/rankings" element={<SellerRankings />} />
        <Route path="/wallet" element={<ProtectedRoute><div><Wallet /></div></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><div><Profile /></div></ProtectedRoute>} />
        <Route path="/auctions" element={<Auctions />} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/saved-searches" element={<ProtectedRoute><SavedSearches /></ProtectedRoute>} />
        <Route path="/reviews/:id" element={<Reviews />} />
        <Route path="/reviews/add/:id" element={<ProtectedRoute><AddReview /></ProtectedRoute>} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/auction/:id" element={<AuctionDetails />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/payment/:id" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment-status" element={<PaymentStatus />} />
        <Route path="/features" element={<FeatureShowcase />} />

        {/* Chat Routes (full-page with sidebar) */}
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/chat/:chatId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

        {/* Seller Join / Upgrade */}
        <Route path="/seller/join" element={<SellerJoin />} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute><AdminDashboard /></AdminRoute>
        } />

        <Route path="/admin/audit-logs" element={
          <AdminRoute><AdminAuditLogs /></AdminRoute>
        } />

        <Route path="/admin/users" element={
          <AdminRoute><AdminUsers /></AdminRoute>
        } />

        <Route path="/admin/auctions" element={
          <AdminRoute><AdminAuctions /></AdminRoute>
        } />

        <Route path="/admin/auctions/add" element={
          <AdminRoute><AdminAddAuction /></AdminRoute>
        } />

        <Route path="/admin/auctions/:id/edit" element={
          <AdminRoute><AdminEditAuction /></AdminRoute>
        } />

        <Route path="/admin/stats" element={
          <AdminRoute><AdminStats /></AdminRoute>
        } />

        <Route path="/admin/notifications" element={
          <AdminRoute><AdminNotifications /></AdminRoute>
        } />

        <Route path="/admin/wallet-approvals" element={
          <AdminRoute><AdminWalletApprovals /></AdminRoute>
        } />

        <Route path="/admin/settings" element={
          <AdminRoute><AdminSettings /></AdminRoute>
        } />

        {/* Seller Routes */}
        <Route
          path="/seller/dashboard"
          element={<ProtectedRoute requiredRole="seller"><SellerDashboard /></ProtectedRoute>}
        />

        <Route
          path="/seller/add"
          element={<ProtectedRoute requiredRole="seller"><SellerAddProduct /></ProtectedRoute>}
        />

        <Route
          path="/seller/edit/:id"
          element={<ProtectedRoute requiredRole="seller"><EditAuction /></ProtectedRoute>}
        />

        <Route
          path="/seller/orders"
          element={<ProtectedRoute requiredRole="seller"><SellerOrders /></ProtectedRoute>}
        />

        <Route
          path="/seller/stats"
          element={<ProtectedRoute requiredRole="seller"><SellerStats /></ProtectedRoute>}
        />
        <Route
          path="/seller/wallet"
          element={<ProtectedRoute requiredRole="seller"><SellerWallet /></ProtectedRoute>}
        />
        <Route
          path="/seller/settings"
          element={<ProtectedRoute requiredRole="seller"><SellerSettings /></ProtectedRoute>}
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
      </ErrorBoundary>
      <Footer />
    </div>
  );
}

export default App;
