import React, { useState } from 'react';
import { Search, ChevronDown, UserPlus, Trash2, CreditCard } from 'lucide-react';
import { NO_IMAGE_SVG } from '../../lib/imageUrl';

export default function PointOfSale() {
  const [products] = useState([
    { id: 1, name: "KASOORI METHI", image: NO_IMAGE_SVG, variants: ["200 gm - ₹ 120"], color: "bg-red-800" },
    { id: 2, name: "KASHMIRI CHILLI POWDER", image: NO_IMAGE_SVG, price: "₹ 450", color: "bg-red-800" },
    { id: 3, name: "BEDGI CHILLI POWDER", image: NO_IMAGE_SVG, price: "₹ 750", color: "bg-red-800" },
    { id: 4, name: "COCONUT POWDER", image: NO_IMAGE_SVG, price: "₹ 240", color: "bg-red-800" },
    { id: 5, name: "TURMARIC POWDER", image: NO_IMAGE_SVG, variants: ["200 gm - ₹ 60"], color: "bg-yellow-500" },
    { id: 6, name: "CORIANDER POWDER", image: NO_IMAGE_SVG, variants: ["200 gm - ₹ 40"], color: "bg-green-700" },
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#4e5e7a]">Point Of Sale</h2>
        <p className="text-sm text-gray-500">
          Home / <span className="text-purple-600">Point Of Sale</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Product Selection */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top Search & Filter */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[250px] space-y-2">
              <label className="block text-sm text-[#4e5e7a]">Filter Product By Category</label>
              <div className="relative">
                <select className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none appearance-none bg-white">
                  <option>Select Categories</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-400" />
              </div>
            </div>
            <div className="flex-1 min-w-[250px] space-y-2">
              <label className="block text-sm text-[#4e5e7a]">Search Your Product</label>
              <input type="text" placeholder="Search Products" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500" />
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                <h4 className="text-[10px] font-bold text-[#4e5e7a] mb-4 text-center">{product.name}</h4>
                <div className="relative w-32 h-40 mb-4">
                  <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                </div>
                {/* Visual Label (e.g., Marathi text area) */}
                <div className={`${product.color} w-full py-1 mb-4 rounded text-center text-white text-[10px]`}>
                   Labels
                </div>
                
                <div className="w-full space-y-3">
                  {product.variants ? (
                    <div className="relative">
                      <select className="w-full border border-gray-200 rounded-lg p-1.5 text-xs outline-none appearance-none bg-white text-center">
                        {product.variants.map(v => <option key={v}>{v}</option>)}
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400" />
                    </div>
                  ) : (
                    <div className="text-center text-xs font-bold text-[#4e5e7a] border border-gray-100 py-1.5 rounded-lg bg-gray-50">
                      {product.price}
                    </div>
                  )}
                  <button className="w-full bg-[#00bcd4] text-white py-2 rounded-lg text-[10px] font-bold shadow-sm hover:bg-[#00acc1] transition-colors">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Cart & Checkout */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-6">
            {/* User Section */}
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Already Registered?</span>
                <button className="bg-[#8592a3] text-white text-[10px] px-3 py-1 rounded">Clear</button>
              </div>
              <div className="relative">
                <select className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none appearance-none bg-white">
                  <option>Search for user</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-400" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Don't Have An Account? Register Here</span>
                <button className="bg-[#71dd37] text-white p-2 rounded-lg shadow-sm hover:opacity-90">
                  <UserPlus size={16} />
                </button>
              </div>
            </div>

            {/* Cart Section */}
            <div className="border-t pt-6 mb-8">
              <h3 className="text-center text-[#6f42c1] font-bold text-lg mb-4">Cart</h3>
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-4 px-2">
                <span>Item</span>
                <span>Price</span>
                <span>Quantity</span>
                <Trash2 size={14} />
              </div>
              <div className="py-12 text-center text-sm text-[#6f42c1] font-medium italic">
                No items in cart
              </div>
              <div className="border-t pt-4 flex justify-between items-center">
                <span className="text-xs font-bold text-[#4e5e7a]">Subtotal</span>
                <span className="text-xs font-bold text-[#4e5e7a]">₹0</span>
              </div>
            </div>

            {/* Delivery & Payment */}
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#6f42c1]">Delivery type</p>
                <div className="space-y-1">
                  <RadioOption label="Local Pickup" name="delivery" checked />
                  <RadioOption label="Door Step Delivery" name="delivery" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-[#6f42c1]">Payment Methods</p>
                <div className="grid grid-cols-1 gap-1">
                  <RadioOption label="Cash" name="payment" />
                  <RadioOption label="Card Payment" name="payment" />
                  <RadioOption label="Bar Code / QR Code Scan" name="payment" />
                  <RadioOption label="Net Banking" name="payment" />
                  <RadioOption label="Online Payment" name="payment" />
                  <RadioOption label="Other" name="payment" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <button className="flex-1 bg-[#ff4d49] text-white py-2 rounded text-[10px] font-bold shadow-md">
                  Clear Cart
                </button>
                <button className="flex-1 bg-[#6f42c1] text-white py-2 rounded text-[10px] font-bold shadow-md">
                  Place Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RadioOption({ label, name, checked }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input type="radio" name={name} defaultChecked={checked} className="w-3 h-3 text-purple-600 focus:ring-purple-500 border-gray-300" />
      <span className="text-[10px] text-gray-600 group-hover:text-purple-600 transition-colors">{label}</span>
    </label>
  );
}