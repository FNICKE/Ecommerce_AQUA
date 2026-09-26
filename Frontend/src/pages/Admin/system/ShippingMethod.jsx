import React from 'react';
import { Truck, Search, Edit, Trash2, Plus, RotateCcw, Save } from 'lucide-react';

const ShippingMethod = () => {
  return (
    <div className="h-screen bg-[#F8F9FB] p-6 font-sans overflow-hidden flex flex-col">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2">
        <div className="p-2 bg-white rounded shadow-sm border border-gray-100">
          <Truck size={18} className="text-purple-600" />
        </div>
        <h1 className="text-base font-bold text-[#334257]">Shipping method</h1>
      </div>

      <div className="flex flex-1 flex-col gap-6 min-h-0 overflow-hidden">
        
        {/* Top Form Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm shrink-0">
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Title</label>
                <input type="text" placeholder="Ex: Default" className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Shipping cost (₹)</label>
                <input type="number" placeholder="Ex: 50" className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400" />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Duration</label>
              <input type="text" placeholder="Ex: 4-6 Days" className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button className="px-5 py-2 text-[11px] font-bold text-gray-400 flex items-center gap-1 hover:text-gray-600">
                <RotateCcw size={14} /> Reset
              </button>
              <button className="px-8 py-2 bg-[#004BB9] text-white rounded-lg text-[11px] font-bold shadow-lg shadow-blue-100 flex items-center gap-2 active:scale-95 transition-all">
                <Save size={14} /> Submit
              </button>
            </div>
          </div>
        </div>

        {/* Table List Card */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          {/* Table Header / Search */}
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-bold text-slate-800">Shipping Method List</h2>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">04</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="text" placeholder="Search..." className="bg-[#F9FBFC] border border-[#E8ECEF] px-8 py-1.5 rounded-lg text-[11px] outline-none w-48 focus:w-64 transition-all" />
            </div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F8F9FB] sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">SL</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase">Cost</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase text-center">Status</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <ShippingRow sl="1" title="Regular Delivery" duration="3-5 Days" cost="₹50" status={true} />
                <ShippingRow sl="2" title="Express Delivery" duration="1-2 Days" cost="₹100" status={true} />
                <ShippingRow sl="3" title="Free Shipping" duration="7-10 Days" cost="₹0" status={false} />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- TABLE ROW COMPONENT --- */
const ShippingRow = ({ sl, title, duration, cost, status }) => (
  <tr className="hover:bg-slate-50 transition-colors">
    <td className="px-6 py-4 text-[11px] font-medium text-slate-500">{sl}</td>
    <td className="px-6 py-4 text-[11px] font-bold text-slate-700">{title}</td>
    <td className="px-6 py-4 text-[11px] font-medium text-slate-500">{duration}</td>
    <td className="px-6 py-4 text-[11px] font-bold text-slate-700">{cost}</td>
    <td className="px-6 py-4 text-center">
      <div className={`mx-auto w-8 h-4 rounded-full p-0.5 flex items-center transition-all ${status ? 'bg-blue-600 justify-end' : 'bg-gray-200 justify-start'}`}>
        <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
      </div>
    </td>
    <td className="px-6 py-4 text-center">
      <div className="flex items-center justify-center gap-2">
        <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded border border-blue-100 transition-colors">
          <Edit size={14} />
        </button>
        <button className="p-1.5 text-red-500 hover:bg-red-50 rounded border border-red-100 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </td>
  </tr>
);

export default ShippingMethod;