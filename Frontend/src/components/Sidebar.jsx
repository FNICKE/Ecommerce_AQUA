import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  LayoutDashboard,
  ShoppingCart,
  List,
  Tag,
  Package,
  Zap,
  Calculator,
  Music,
  Sliders,
  Gift,
  Box,
  MessageSquare,
  Ticket,
  TicketIcon,
  Layers,
  User,
  RotateCcw,
  Truck,
  Settings,
  Globe,
  ChevronRight,
  LogOut,
  Wallet,
  Send,
  MapPin,
  HelpCircle,
  Users,
  BarChart3,
  Map,
} from "lucide-react";

export default function Sidebar({ isSidebarOpen }) {
  const { logout, user } = useAuthStore();
  const location = useLocation();
  const [expandedMenu, setExpandedMenu] = useState(null);

  const isBasic = user?.role === "basic";
  const allowedItemsBasic = [
    "Dashboard",
    "Categories",
    "Products",
    "Media",
    "Sliders",
    "System",
    "Web Settings",
    "FAQ"
  ];

  const isItemDisabled = (itemName) => {
    if (!isBasic) return false;
    return !allowedItemsBasic.includes(itemName);
  };

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      color: "text-red-500",
      path: "/admin",
    },
    {
      name: "Orders",
      icon: ShoppingCart,
      color: "text-green-500",
      hasSub: true,
      subItems: [
        { name: "Orders", path: "/admin/orders" },
        { name: "Order Tracking", path: "/admin/order-tracking" },
      ],
    },
    {
      name: "Categories",
      icon: List,
      color: "text-purple-500",
      hasSub: true,
      subItems: [
        { name: "Categories", path: "/admin/categories" },
        { name: "Category Order", path: "/admin/categories-order" },
      ],
    },
    { name: "Brands", icon: Tag, color: "text-orange-500", path: "/admin/brands" },
    {
      name: "Products",
      icon: Package,
      color: "text-blue-400",
      hasSub: true,
      subItems: [
        { name: "Attributes", path: "/admin/attributes" },
        { name: "Tax", path: "/admin/taxes" },
        { name: "Add Product", path: "/admin/add-product" },
        { name: "Bulk Upload", path: "/admin/bulk-upload" },
        { name: "Manage Products", path: "/admin/manage-products" },
        { name: "Product FAQs", path: "/admin/product-faqs" },
        { name: "Products Order", path: "/admin/products-order" },
      ],
    },
    { name: "Media", icon: Music, color: "text-purple-600", path: "/admin/media" },
    { name: "Sliders", icon: Sliders, color: "text-orange-400", path: "/admin/sliders" },
    {
      name: "Offers",
      icon: Gift,
      color: "text-cyan-400",
      hasSub: true,
      subItems: [
        { name: "Offers", path: "/admin/offer" },
        { name: "Offers Slider", path: "/admin/offer-slider" },
        { name: "Sections Order", path: "/admin/featured-sections-order" },
      ],
    },
    { name: "Manage Stock", icon: Box, color: "text-red-600", path: "/admin/product-stock" },
    { name: "Promo Code", icon: TicketIcon, color: "text-purple-700", path: "/admin/promo-codes" },
    {
      name: "Featured Sections",
      icon: Layers,
      color: "text-orange-500",
      hasSub: true,
      subItems: [
        { name: "Manage Sections", path: "/admin/feature" },
        { name: "Sections Order", path: "/admin/featured-sections-order" },
      ],
    },
    {
      name: "Customer",
      icon: User,
      color: "text-cyan-500",
      hasSub: true,
      subItems: [
        { name: "View Customers", path: "/admin/system-users" },
        { name: "Addresses", path: "#" },
        { name: "Transactions", path: "#" },
        { name: "Wallet Transactions", path: "#" },
      ],
    },
    {
      name: "System",
      icon: Settings,
      color: "text-red-500",
      path:"/admin/system"
    },
    { name: "Web Settings", icon: Globe, color: "text-green-600", path: "/admin/web-settings" },
    {
      name: "Reports",
      icon: BarChart3,
      color: "text-cyan-600",
      hasSub: true,
      subItems: [
        { name: "Sales Report", path: "/admin/sales-report" },
        { name: "Inventory Report", path: "/admin/inventory-report" },
      ],
    },
    { name: "System Users", icon: Users, color: "text-green-500", path: "/admin/system-users" },
  ];

  return (
    <aside
      className={`${isSidebarOpen ? "w-64" : "w-20"} bg-white h-full shadow-xl transition-all duration-300 flex flex-col overflow-y-auto shrink-0 border-r border-gray-100`}
    >
      <div className="p-6 flex items-center border-b sticky top-0 bg-white z-10">
        {isSidebarOpen && (
          <span className="font-bold text-gray-700 text-lg truncate uppercase tracking-tight">
            Admin Panel
          </span>
        )}
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => {
          const disabled = isItemDisabled(item.name);
          return (
            <div key={item.name} className={disabled ? "opacity-40 cursor-not-allowed" : ""}>
              {item.hasSub ? (
                <button
                  disabled={disabled}
                  onClick={() =>
                    !disabled && setExpandedMenu(expandedMenu === item.name ? null : item.name)
                  }
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                    disabled ? "pointer-events-none" : ""
                  } ${
                    expandedMenu === item.name
                      ? "bg-purple-50 text-purple-700"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={20} className={item.color} />
                    {isSidebarOpen && (
                      <span className="font-medium text-sm">{item.name}</span>
                    )}
                  </div>
                  {isSidebarOpen && (
                    <ChevronRight
                      size={14}
                      className={`transition-transform duration-200 ${expandedMenu === item.name ? "rotate-90" : ""}`}
                    />
                  )}
                </button>
              ) : (
                <Link
                  to={disabled ? "#" : item.path}
                  onClick={(e) => disabled && e.preventDefault()}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    disabled ? "pointer-events-none" : ""
                  } ${
                    location.pathname === item.path
                      ? "bg-purple-50 text-purple-700"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <item.icon size={20} className={item.color} />
                  {isSidebarOpen && (
                    <span className="font-medium text-sm">{item.name}</span>
                  )}
                </Link>
              )}

              {/* Sub-menu items */}
              {isSidebarOpen && item.hasSub && expandedMenu === item.name && (
                <div className="mt-1 ml-4 space-y-1 border-l-2 border-gray-100 pl-2">
                  {item.subItems?.map((sub) => (
                    <Link
                      key={sub.name}
                      to={sub.path}
                      className="flex items-center gap-3 p-2.5 text-sm font-medium transition-colors rounded-lg text-gray-500 hover:text-purple-600 hover:bg-gray-50"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Logout at the bottom */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 p-3 mt-4 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
        >
          <LogOut size={20} className="text-red-500" />
          {isSidebarOpen && <span className="font-medium text-sm">Logout</span>}
        </button>
      </nav>
    </aside>
  );
}