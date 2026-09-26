import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../../../store/toastStore';
import { useAuthStore } from '../../../store/authStore';
import { 
  Store, 
  Mail, 
  CreditCard, 
  Rocket, 
  MessageSquare, 
  Bell, 
  Settings, 
  Phone, 
  Info, 
  ShieldCheck, 
  RotateCcw, 
  Truck, 
  UserCircle, 
  CheckSquare,
  ArrowRightCircle
} from 'lucide-react';

const System = () => {
  const navigate = useNavigate();
  const { showToast } = useToastStore();
  const { user } = useAuthStore();

  const isBasic = user?.role === 'basic';

  const settingsOptions = [
    { title: "Store Setting", icon: <Store size={24} />, link: "/admin/store-setting" },
    { title: "Email setting", icon: <Mail size={24} />, link: "/admin/notification-settings?tab=email" },
    { title: "Payment methods", icon: <CreditCard size={24} />, link: "/admin/payment-methods" },
    { title: "Shipping methods", icon: <Rocket size={24} />, link: "/admin/shipping-methods" },
    { title: "Review Settings", icon: <MessageSquare size={24} />, link: "/admin/review-settings" },
    { title: "Blogs Settings", icon: <CheckSquare size={24} />, link: "/admin/blogs-settings" },
    { title: "Notification settings", icon: <Bell size={24} />, link: "/admin/notification-settings?tab=email" },
    { title: "Authentication settings", icon: <Settings size={24} />, link: "#" },
    { title: "SMS Gateway settings", icon: <MessageSquare size={24} />, link: "/admin/notification-settings?tab=sms" },
    { title: "Contact us", icon: <Phone size={24} />, link: "/admin/contact-editor" },
    { title: "About us", icon: <Info size={24} />, link: "/admin/about-editor" },
    { title: "Privacy policy", icon: <ShieldCheck size={24} />, link: "/admin/privacy-policy" },
    { title: "Terms & conditions", icon: <CheckSquare size={24} />, link: "/admin/terms-conditions" },
    { title: "Return policy", icon: <RotateCcw size={24} />, link: "/admin/return-policy" },
    { title: "Shipping policy", icon: <Truck size={24} />, link: "/admin/shipping-policy" },
  ];

  const handleOptionClick = (option) => {
    if (isBasic && option.title !== 'Store Setting') {
      showToast(`Access Denied: ${option.title} is restricted for Basic accounts.`, 'warning');
      return;
    }
    if (option.link !== "#") {
      navigate(option.link);
    } else {
      showToast(`${option.title} setting is under development.`, 'info');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn font-sans">
      {/* Breadcrumb Header */}
      <div className="flex justify-between items-center select-none pb-2 border-b border-gray-100/50">
        <h2 className="text-xl font-semibold text-slate-700 font-sans tracking-tight">System Settings</h2>
        <div className="text-xs md:text-sm text-gray-400 font-medium">
          <span 
            className="hover:text-purple-600 cursor-pointer transition-colors"
            onClick={() => navigate('/admin')}
          >
            Home
          </span>
          <span className="mx-2">/</span>
          <span className="text-slate-600 font-semibold">System settings</span>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-2">
        {settingsOptions.map((option, index) => {
          const disabled = isBasic && option.title !== 'Store Setting';
          return (
            <div 
              key={index} 
              onClick={() => handleOptionClick(option)}
              className={`bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4 min-h-[140px] ${
                disabled 
                  ? "opacity-40 cursor-not-allowed" 
                  : "hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group"
              }`}
            >
              {/* Icon Container */}
              <div className={`w-12 h-12 bg-slate-400 text-white rounded-lg flex items-center justify-center transition-colors ${
                disabled ? "" : "group-hover:bg-purple-600"
              }`}>
                {option.icon}
              </div>

              {/* Title and Link */}
              <div className="flex items-center gap-2 mt-auto">
                <span className={`text-[15px] font-bold text-indigo-900 transition-colors ${
                  disabled ? "" : "group-hover:text-purple-600"
                }`}>
                  {option.title}
                </span>
                <ArrowRightCircle 
                  size={18} 
                  className={`text-purple-600 transition-transform ${
                    disabled ? "" : "group-hover:translate-x-1"
                  }`} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default System;