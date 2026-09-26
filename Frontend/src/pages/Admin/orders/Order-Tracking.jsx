import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, RefreshCw, List, Download, ChevronDown, 
  MoreVertical, ExternalLink 
} from 'lucide-react';
import api from '../../../lib/api';

export default function OrderTracking() {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [trackingData, setTrackingData] = useState([]);
  const [error, setError] = useState(null);

  const fetchTracking = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/orders/admin/tracking', {
        params: { search: searchTerm }
      });
      setTrackingData(res.data?.tracking || []);
    } catch (err) {
      console.error('Failed to fetch tracking data:', err);
      setError(err.response?.data?.message || 'Failed to fetch tracking data');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  const handleRefresh = () => {
    fetchTracking();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-4 lg:p-0">
      {/* Page Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#4e5e7a]">Order Tracking</h1>
        </div>
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">Home</span>
          <span className="text-gray-300">/</span>
          <span className="text-[#4e5e7a] font-medium">Order Tracking</span>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Table Controls (Search & Tools) */}
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-end gap-4">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Search Input */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search Order ID" 
                className="pl-4 pr-10 py-2 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-purple-500 outline-none w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchTracking()}
              />
            </div>

            {/* Action Buttons Group */}
            <div className="flex items-center bg-[#f8f9fa] border border-gray-200 rounded-md">
              <button 
                onClick={handleRefresh}
                className={`p-2 hover:bg-white transition-all border-r border-gray-200`}
                title="Refresh"
              >
                <RefreshCw size={18} className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              <button className="p-2 hover:bg-white transition-all border-r border-gray-200 flex items-center gap-1" title="Columns">
                <List size={18} className="text-gray-600" />
                <ChevronDown size={12} className="text-gray-400" />
              </button>
              
              <button className="p-2 hover:bg-white transition-all flex items-center gap-1" title="Export">
                <Download size={18} className="text-gray-600" />
                <ChevronDown size={12} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#fcfcfd] border-t border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold text-[#4e5e7a] border-r border-gray-50 flex items-center justify-between">
                  ID <ChevronDown size={14} className="text-purple-600" />
                </th>
                <th className="px-6 py-4 font-bold text-[#4e5e7a] border-r border-gray-50">
                  <div className="flex items-center justify-between">
                    ORDER ID <div className="flex flex-col gap-0.5"><ChevronDown size={10} className="rotate-180 opacity-30"/><ChevronDown size={10} className="opacity-30"/></div>
                  </div>
                </th>
                <th className="px-6 py-4 font-bold text-[#4e5e7a] border-r border-gray-50 uppercase">
                  Courier Agency
                </th>
                <th className="px-6 py-4 font-bold text-[#4e5e7a] border-r border-gray-50 uppercase">
                  Tracking ID
                </th>
                <th className="px-6 py-4 font-bold text-[#4e5e7a] border-r border-gray-50 uppercase">
                  URL
                </th>
                <th className="px-6 py-4 font-bold text-[#4e5e7a] border-r border-gray-50 uppercase">
                  Date
                </th>
                <th className="px-6 py-4 font-bold text-[#4e5e7a] uppercase text-center">
                  Actions
                </th>
              </tr>
            </thead>
            
            <tbody>
              {loading && trackingData.length === 0 ? (
                <tr>
                   <td colSpan="7" className="px-6 py-12 text-center text-[#4e5e7a] font-medium">
                     Loading tracking data...
                   </td>
                </tr>
              ) : error ? (
                <tr>
                   <td colSpan="7" className="px-6 py-12 text-center text-red-500 font-medium">
                     {error}
                   </td>
                </tr>
              ) : trackingData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-[#4e5e7a] font-medium">
                    No matching records found
                  </td>
                </tr>
              ) : (
                trackingData.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-purple-600 font-medium">#{row.id}</td>
                    <td className="px-6 py-4 text-gray-700">#{row.order_id}</td>
                    <td className="px-6 py-4 text-gray-700">{row.courier_agency || row.agency || '-'}</td>
                    <td className="px-6 py-4 text-gray-700">{row.tracking_id || '-'}</td>
                    <td className="px-6 py-4">
                      {row.url ? (
                        <a href={row.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                          Link <ExternalLink size={12} />
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {row.date_created ? new Date(row.date_created).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <MoreVertical size={18} className="text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}