import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../../../store/toastStore';
import { useAuthStore } from '../../../store/authStore';
import { Laptop, Palette, Languages, ArrowRight } from 'lucide-react';

// Custom white SVG of the Firebase logo
const FirebaseLogo = ({ size = 20, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    fill="currentColor" 
    className={className}
  >
    <path d="M3.89 15.75L2 6.06c-.11-.53.25-.86.68-.61l9.16 5.25-7.95 5.05zm8.94-13.54c-.34-.41-.95-.41-1.3 0L9.04 4.7l2.84 2.87 1.2-2.39c.2-.41.05-1.02-.25-1.12zm2.59 18.17l6.39-11.55c.29-.53-.11-1.19-.73-1.02l-4.57 1.25-2.92-2.87 3.54 9.68v4.51zM11.88 10.7L9.04 4.7l-5.15 11.05 11.53 4.63 6.5-11.56c.62-.17 1.02.49.73 1.02l-11.88-5.14zm4.62 5.8L11.88 10.7l-8 5.05 11.54 4.63c.62.25 1.25-.13 1.08-.75l-4.62-5.8z" />
  </svg>
);

export default function WebSettings() {
  const navigate = useNavigate();
  const { showToast } = useToastStore();
  const { user } = useAuthStore();

  const isBasic = user?.role === 'basic';

  const settingsCards = [
    {
      title: 'General setting',
      icon: <Laptop size={22} />,
      link: '/admin/general-settings',
      isPlaceholder: false
    },
    {
      title: 'Themes',
      icon: <Palette size={22} />,
      link: '/admin/theme-settings',
      isPlaceholder: false
    },
    {
      title: 'Languages',
      icon: <Languages size={22} />,
      link: '/admin/language-settings',
      isPlaceholder: false
    },
    {
      title: 'Firebase',
      icon: <FirebaseLogo size={22} />,
      link: '/admin/firebase-settings',
      isPlaceholder: false
    }
  ];

  const handleCardClick = (card) => {
    if (isBasic && card.title !== 'General setting') {
      showToast(`Access Denied: ${card.title} is restricted for Basic accounts.`, 'warning');
      return;
    }
    if (card.isPlaceholder) {
      showToast(`${card.title} setting is under development.`, 'info');
    } else {
      navigate(card.link);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn font-sans">
      {/* Breadcrumb Header matching mockup spacing and case */}
      <div className="flex justify-between items-center select-none pb-2 border-b border-gray-100/50">
        <h2 className="text-xl font-semibold text-slate-700 font-sans tracking-tight">Web Settings</h2>
        <div className="text-xs md:text-sm text-gray-400 font-medium">
          <span 
            className="hover:text-purple-600 cursor-pointer transition-colors"
            onClick={() => navigate('/admin')}
          >
            Home
          </span>
          <span className="mx-2">/</span>
          <span className="text-slate-600 font-semibold">Web settings</span>
        </div>
      </div>

      {/* Grid Layout matching mockup dimensions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-2">
        {settingsCards.map((card, index) => {
          const disabled = isBasic && card.title !== 'General setting';
          return (
            <div
              key={index}
              onClick={() => handleCardClick(card)}
              className={`bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-5 min-h-[145px] ${
                disabled 
                  ? "opacity-40 cursor-not-allowed" 
                  : "hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group"
              }`}
            >
              {/* Slate-blue Icon Container */}
              <div className={`w-12 h-12 bg-[#828F9F] text-white rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm ${
                disabled ? "" : "group-hover:bg-purple-600"
              }`}>
                {card.icon}
              </div>

              {/* Purple Link Title & Arrow */}
              <div className="flex items-center gap-2 mt-auto">
                <span className={`text-[15px] font-bold text-purple-700 transition-colors ${
                  disabled ? "" : "group-hover:text-purple-800"
                }`}>
                  {card.title}
                </span>
                <div className={`w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0 transition-all duration-300 ${
                  disabled ? "" : "group-hover:bg-purple-700 group-hover:translate-x-0.5"
                }`}>
                  <ArrowRight size={11} strokeWidth={3} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
