// src/components/Navbar.jsx
import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useWishlistStore } from "../store/wishlistStore";
import { useThemeStore } from "../store/themeStore";
import { useCartStore } from "../store/cartStore";
import {
  ShoppingCart,
  Heart,
  User,
  Search,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  Package,
} from "lucide-react";
import api from "../lib/api";
import { getImageUrl } from "../lib/imageUrl";
import { motion, AnimatePresence } from "framer-motion";

// Helper component to highlight matching text
const HighlightText = ({ text, highlight }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }
  
  // Escape regex special characters from highlight string
  const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedHighlight = escapeRegExp(highlight);
  const regex = new RegExp(`(${escapedHighlight})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <span key={i} className="bg-yellow-200 dark:bg-yellow-500/30 text-yellow-900 dark:text-yellow-200 px-0.5 rounded-sm font-semibold">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

// ── CATEGORY MEGA DROPDOWN (desktop) ─────────────────────────────────────────
const COLORS = [
  "#7c3aed", "#0ea5e9", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16",
];

function CategoryMegaDropdown({ categoriesTree }) {
  const [hoveredId, setHoveredId] = useState(null);
  const leaveTimer = useRef(null);

  // Cancel any pending clear when mouse enters a zone
  const cancelLeave = () => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  };

  // Debounce the clear so moving between left→right panel doesn't flicker
  const scheduleClear = () => {
    cancelLeave();
    leaveTimer.current = setTimeout(() => setHoveredId(null), 120);
  };

  const handleEnterItem = (id) => {
    cancelLeave();
    setHoveredId(id);
  };

  const rootCats = categoriesTree;
  const hoveredCat = rootCats.find(c => c.id === hoveredId);
  const subCats = hoveredCat?.subcategories || [];

  return (
    <div
      className="absolute top-full left-0 pt-2 opacity-0 invisible pointer-events-none
                 group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto
                 transition-all duration-200 ease-out z-50"
      style={{ transform: "translateY(-4px)" }}
      onMouseLeave={scheduleClear}
      onMouseEnter={cancelLeave}
    >
      <div
        className="flex rounded-xl border border-gray-200 overflow-hidden bg-white"
        style={{ boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)" }}
      >

        {/* ── LEFT PANEL: root categories ── */}
        <div style={{ width: 230 }}>
          {/* header — matches Products page "Filter" heading style */}
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900 m-0">Categories</h2>
          </div>

          <div className="overflow-y-auto py-2 hide-scrollbar" style={{ maxHeight: 310 }}>
            {rootCats.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">No categories</div>
            ) : (
              rootCats.map((cat, idx) => {
                const hasSubs = cat.subcategories && cat.subcategories.length > 0;
                const isHovered = hoveredId === cat.id;
                return (
                  <div key={cat.id} onMouseEnter={() => handleEnterItem(cat.id)}>
                    <Link
                      to={`/category/${cat.id}`}
                      className={`flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors duration-100 ${
                        isHovered
                          ? "bg-primary/10 text-primary"
                          : "text-gray-700 hover:bg-[#f5f5f5] hover:text-primary"
                      }`}
                    >
                      {/* Tiny color dot — like the brand filter dots on products page */}
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: COLORS[idx % COLORS.length] }}
                      />
                      <span className="flex-1 truncate">{cat.name}</span>
                      {hasSubs && (
                        <svg
                          className={`w-3 h-3 flex-shrink-0 transition-colors ${isHovered ? "text-primary" : "text-gray-300"}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </Link>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer — View All link */}
          <div className="border-t border-gray-100 px-4 py-2.5">
            <Link
              to="/category"
              className="text-[12px] font-semibold text-primary hover:underline"
            >
              View all categories →
            </Link>
          </div>
        </div>

        {/* ── RIGHT FLYOUT PANEL: subcategories — #f5f5f5 bg like Products page ── */}
        {subCats.length > 0 && (
          <div
            className="border-l border-gray-200"
            style={{ width: 210, background: "#f5f5f5" }}
            onMouseEnter={cancelLeave}
          >
            {/* sub-header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-white">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 m-0">
                {hoveredCat?.name}
              </p>
            </div>
            <div className="py-2 hide-scrollbar" style={{ maxHeight: 310, overflowY: "auto" }}>
              {subCats.map((sub, si) => (
                <Link
                  key={sub.id}
                  to={`/category/${sub.id}`}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-gray-600 hover:bg-white hover:text-primary transition-colors duration-100"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: COLORS[(si + 3) % COLORS.length] }}
                  />
                  <span className="flex-1 truncate">{sub.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


export function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { wishlistItems, fetchWishlist } = useWishlistStore();
  const { theme, toggleTheme } = useThemeStore();
  const { cartItems, fetchCart } = useCartStore();

  const handleToggleTheme = () => {
    toggleTheme();
  };
  const location = useLocation();
  const navigate = useNavigate();

  const [config, setConfig] = useState({
    site_name: "",
    logo_url: "",
    site_title_image: "",
  });

  const [categories, setCategories] = useState([]);
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [hoveredParent, setHoveredParent] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Dropdowns
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);

  const searchRef = useRef(null);
  const categoryRef = useRef(null);

  useEffect(() => {
    const flattenTree = (cats) => {
      let flat = [];
      cats.forEach(cat => {
        flat.push(cat);
        if (cat.subcategories && cat.subcategories.length > 0) {
          flat = [...flat, ...flattenTree(cat.subcategories)];
        }
      });
      return flat;
    };

    const fetchData = async () => {
      try {
        const contentRes = await api.get("/config/public");
        setConfig({
          site_name: contentRes.data.site_name?.trim() || "",
          logo_url: contentRes.data.logo_url || "",
          site_title_image: contentRes.data.site_title_image || "",
        });

        // Fetch tree (root categories with subcategories nested)
        const catRes = await api.get("/categories?include_subcategories=true&include_inactive=true");
        const tree = catRes.data.categories || [];
        setCategoriesTree(tree); // tree: [{...cat, subcategories:[...]}, ...]
        const flat = flattenTree(tree);
        setCategories([{ name: "All Categories" }, ...flat]);
      } catch (err) {
        console.error("Navbar load error:", err);
      } finally {
        setIsLoadingConfig(false);
      }
    };
    fetchData();
    fetchCart();
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated, fetchCart]);

  useEffect(() => {
    const handleTitleLoaded = () => {
      if (window.siteName) {
        setConfig(prev => ({
          ...prev,
          site_name: window.siteName
        }));
      }
    };
    window.addEventListener('siteTitleLoaded', handleTitleLoaded);
    if (window.siteName) {
      handleTitleLoaded();
    }
    return () => {
      window.removeEventListener('siteTitleLoaded', handleTitleLoaded);
    };
  }, []);

  // Search suggestions debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 1) {
        setSearchLoading(true);
        try {
          const params = new URLSearchParams({
            q: searchQuery.trim(),
            limit: 8,
          });
          const res = await api.get(`/products/search?${params}`);
          setSuggestions(res.data.products || []);
          setCategorySuggestions(res.data.categories || []);
          setShowSuggestions(true);
        } catch {
          setSuggestions([]);
          setCategorySuggestions([]);
        } finally {
          setSearchLoading(false);
        }
      } else {
        setShowSuggestions(false);
        setSuggestions([]);
        setCategorySuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false);
      if (categoryRef.current && !categoryRef.current.contains(e.target)) setShowCategoryDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
      {/* ================= TOP BAR ================= */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            {config.logo_url && (
              <img 
                src={getImageUrl(config.logo_url)} 
                alt="Logo" 
                className="h-14 md:h-16 w-auto object-contain group-hover:scale-105 transition-transform"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            {config.site_title_image ? (
              <img 
                src={getImageUrl(config.site_title_image)} 
                alt={config.site_name || "Site Title"} 
                className="h-7 md:h-8 w-auto object-contain hidden sm:block group-hover:scale-105 transition-transform"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <span className="hidden sm:block text-xl font-extrabold text-primary tracking-tight dark:text-primary-light">
                {isLoadingConfig ? "..." : config.site_name}
              </span>
            )}
          </Link>

          {/* SEARCH BAR (DESKTOP) */}
          <div className="hidden md:flex flex-1 max-w-2xl relative" ref={searchRef}>
            <form
              onSubmit={handleSearchSubmit}
              className="flex w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 overflow-hidden focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary focus-within:bg-white dark:focus-within:bg-slate-800 transition-all duration-300"
            >
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for items..."
                className="flex-1 px-4 py-2.5 bg-transparent outline-none text-sm placeholder:text-gray-400 text-gray-900 dark:text-slate-100"
              />

              <button type="submit" className="px-5 text-gray-400 hover:text-primary dark:hover:text-primary-light hover:bg-primary/5 transition-all">
                <Search size={20} />
              </button>
            </form>

            {/* SEARCH SUGGESTIONS */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden z-[100] py-2 max-h-[70vh] flex flex-col"
                >
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Search Results
                    </span>
                  </div>
                  
                  <div className="overflow-y-auto flex-1 pb-2">
                    {searchLoading ? (
                      <div className="p-8 flex justify-center items-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : suggestions.length > 0 || categorySuggestions.length > 0 ? (
                      <>
                        {/* CATEGORY SUGGESTIONS */}
                        {categorySuggestions.map((cat) => (
                          <button 
                            key={`cat-${cat.id}`} 
                            type="button"
                            className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group border-b border-gray-50 dark:border-slate-700/50"
                            onClick={() => {
                              setSearchQuery("");
                              setShowSuggestions(false);
                              navigate(`/category/${cat.id}`);
                              setMobileMenuOpen(false);
                            }}
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-primary-light shrink-0">
                              <Search size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary dark:group-hover:text-primary-light transition-colors">
                                <HighlightText text={cat.name} highlight={searchQuery} />
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
                            </div>
                          </button>
                        ))}

                        {/* PRODUCT SUGGESTIONS */}
                        {suggestions.map((item) => (
                          <button 
                            key={`prod-${item.id}`} 
                            type="button"
                            className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group border-b border-gray-50 dark:border-slate-700/50 last:border-0"
                            onClick={() => {
                              setSearchQuery("");
                              setShowSuggestions(false);
                              navigate(`/product/${item.slug || item.id}`);
                              setMobileMenuOpen(false);
                            }}
                          >
                            <div className="flex-1 min-w-0 py-0.5">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary dark:group-hover:text-primary-light transition-colors">
                                <HighlightText text={item.name} highlight={searchQuery} />
                              </h4>
                              {item.category_name && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                  <HighlightText text={item.category_name} highlight={searchQuery} />
                                </p>
                              )}
                            </div>
                            
                            <div className="shrink-0 text-right py-0.5">
                              {item.special_price && item.special_price < item.price ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">₹{item.special_price}</span>
                                  <span className="text-xs text-gray-400 line-through">₹{item.price}</span>
                                </div>
                              ) : (
                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">₹{item.price}</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="p-8 text-center flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3">
                          <Search size={20} className="text-gray-400" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">No matches found</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Try checking for typos or using different keywords</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT ICONS */}
          <div className="flex items-center gap-1 sm:gap-3">
            <Link to="/cart" className="p-2.5 text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/5 rounded-full relative transition-all group">
              <ShoppingCart size={22} />
              {cartItems.length > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white group-hover:scale-110 transition-transform"></span>
              )}
            </Link>
            
            <Link to="/wishlist" className="flex p-2.5 text-gray-600 dark:text-gray-300 hover:text-accent hover:bg-accent/5 rounded-full transition-all relative group">
              <Heart size={22} className={wishlistItems.length > 0 ? "fill-accent text-accent" : ""} />
              {wishlistItems.length > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-accent rounded-full border-2 border-white group-hover:scale-110 transition-transform"></span>
              )}
            </Link>

            <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block"></div>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/profile" className="p-2.5 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-full transition-all">
                  <User size={22} />
                </Link>
                <button
                  onClick={() => { logout(); navigate("/login"); }}
                  className="hidden md:flex items-center gap-2 text-red-600 text-sm font-bold hover:bg-red-50 px-4 py-2 rounded-xl transition-all"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-all shadow-md shadow-primary/20">
                Login
              </Link>
            )}

            <button className="md:hidden p-2 ml-1 text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={28} />
            </button>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM NAV (DESKTOP) ================= */}
      <nav className="hidden md:block bg-primary/10 dark:bg-primary-dark/20 border-t border-primary/5 dark:border-primary-light/10 relative z-20">
        <div className="max-w-7xl mx-auto px-6 flex gap-2 h-12 items-center">
          {[
            { path: "/", label: "Home" },
            { path: "/category", label: "Category", hasDropdown: true },
            { path: "/products", label: "Products" },
            { path: "/offers", label: "Top Offers" },
            { path: "/about", label: "About" },
            { path: "/contact", label: "Contact" }
          ].map((item) => (
            item.hasDropdown ? (
              <div key={item.path} className="relative group h-full flex items-center">
                {/* Trigger button */}
                <Link
                  to={item.path}
                  className={`flex items-center gap-1 px-5 py-1.5 rounded-lg text-[13px] font-bold transition-all duration-200 ${
                    isActive(item.path)
                      ? "bg-white dark:bg-slate-900 text-primary dark:text-primary-light shadow-sm scale-105"
                      : "text-primary dark:text-primary-light/80 hover:bg-white/50 dark:hover:bg-slate-800/50 group-hover:bg-white/50 dark:group-hover:bg-slate-800/50 group-hover:text-primary dark:group-hover:text-primary-light"
                  }`}
                >
                  {item.label}
                  <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300 text-slate-400 group-hover:text-primary dark:group-hover:text-primary-light" />
                </Link>

                {/* ── CATEGORY MEGA DROPDOWN ── */}
                <CategoryMegaDropdown categoriesTree={categoriesTree} />
              </div>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                className={`px-5 py-1.5 rounded-lg text-[13px] font-bold transition-all duration-200 ${
                  isActive(item.path)
                    ? "bg-white dark:bg-slate-900 text-primary dark:text-primary-light shadow-sm scale-105"
                    : "text-primary dark:text-primary-light/80 hover:bg-white/50 dark:hover:bg-slate-800/50"
                }`}
              >
                {item.label}
              </Link>
            )
          ))}
        </div>
      </nav>

      {/* ================= MOBILE DRAWER MENU ================= */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-80 h-full bg-white dark:bg-slate-900 shadow-2xl z-[70] flex flex-col md:hidden"
            >
              <div className="p-6 flex items-center justify-between border-b dark:border-slate-800">
                <span className="font-extrabold text-xl text-primary dark:text-primary-light">Navigation</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2.5 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-full hover:bg-primary/5 hover:text-primary transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                <form onSubmit={handleSearchSubmit} className="relative mb-8">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-100 dark:bg-slate-800 rounded-2xl border-none text-sm font-medium focus:ring-2 ring-primary/50 dark:text-white transition-all"
                  />
                </form>

                <nav className="space-y-2">
                  {["Home", "Category", "Products", "Offers", "Contact", "About"].map((label) => {
                    const path = label === "Home" ? "/" : `/${label.toLowerCase().replace(" ", "")}`;
                    
                    if (label === "Category") {
                      return (
                        <div key={path} className="flex flex-col">
                          <div className="flex items-center justify-between">
                            <Link
                              to={path}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex-1 py-3.5 px-5 rounded-2xl text-base font-bold transition-all ${
                                isActive(path) ? "bg-primary/5 dark:bg-primary/20 text-primary dark:text-primary-light" : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                              }`}
                            >
                              {label}
                            </Link>
                            <button 
                              onClick={() => setMobileCategoryOpen(!mobileCategoryOpen)}
                              className="p-3 ml-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                            >
                              <ChevronDown size={20} className={`transition-transform duration-300 ${mobileCategoryOpen ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                          
                          {/* Mobile Dropdown */}
                          <AnimatePresence>
                            {mobileCategoryOpen && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden bg-gray-50 dark:bg-slate-800/50 rounded-xl mt-1 mx-4 border border-transparent dark:border-slate-800"
                              >
                                {categories.filter(c => c.name !== "All Categories").map(cat => (
                                  <Link
                                    key={cat.id || cat.name}
                                    to={`/category/${cat.id}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-5 py-3 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary-light hover:bg-primary/10 transition-colors"
                                  >
                                    {cat.name}
                                  </Link>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={path}
                        to={path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block py-3.5 px-5 rounded-2xl text-base font-bold transition-all ${
                          isActive(path) ? "bg-primary/5 dark:bg-primary/20 text-primary dark:text-primary-light" : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        {label}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="p-6 border-t dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                 {isAuthenticated ? (
                   <button onClick={logout} className="w-full py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all">
                     <LogOut size={18} /> Logout
                   </button>
                 ) : (
                   <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full py-4 bg-primary text-white text-center rounded-2xl font-bold shadow-lg shadow-primary/10 active:scale-95 transition-all">
                     Login / Register
                   </Link>
                 )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar-visible::-webkit-scrollbar {
          width: 6px;
          display: block;
        }
        .custom-scrollbar-visible::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.03);
          border-radius: 10px;
        }
        .custom-scrollbar-visible::-webkit-scrollbar-thumb {
          background: var(--primary);
          border-radius: 10px;
        }
        .custom-scrollbar-visible::-webkit-scrollbar-thumb:hover {
          background: var(--primary-dark);
        }
      `}</style>
    </header>
  );
}
