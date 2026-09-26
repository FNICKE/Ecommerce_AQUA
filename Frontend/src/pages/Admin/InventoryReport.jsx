import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Download,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  TrendingUp,
  ShoppingBag,
  Layers,
  ChevronDown
} from "lucide-react";
import api from "../../lib/api";

export default function InventoryReport() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState("");
  const [toast, setToast] = useState(null);

  // Sorting State
  const [sortField, setSortField] = useState("total_sales");
  const [sortDirection, setSortDirection] = useState("desc");

  // Columns Configuration
  const [activeColumns, setActiveColumns] = useState({
    productName: true,
    variantId: true,
    unitOfMeasure: true,
    totalUnitsSold: true,
    totalSales: true
  });
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const columnsRef = useRef(null);
  const exportRef = useRef(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (columnsRef.current && !columnsRef.current.contains(event.target)) {
        setIsColumnsOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Inventory Report
  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders/admin/inventory-report");
      if (res.data?.success) {
        setReportData(res.data.report || []);
      }
    } catch (err) {
      console.error("Failed to fetch inventory statistics:", err);
      showToast("Failed to fetch inventory statistics", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  // Toast Helper
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sorting Handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filtered & Sorted inventory records
  const filteredRecords = useMemo(() => {
    let result = [...reportData];

    // Search filter
    if (globalSearch.trim()) {
      const query = globalSearch.toLowerCase();
      result = result.filter(
        (rec) =>
          String(rec.product_name || "").toLowerCase().includes(query) ||
          String(rec.product_variant_id || "").toLowerCase().includes(query) ||
          String(rec.unit_of_measure || "").toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "product_variant_id") {
        aVal = Number(a.product_variant_id);
        bVal = Number(b.product_variant_id);
      } else if (sortField === "total_units_sold") {
        aVal = Number(a.total_units_sold);
        bVal = Number(b.total_units_sold);
      } else if (sortField === "total_sales") {
        aVal = Number(a.total_sales);
        bVal = Number(b.total_sales);
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [reportData, globalSearch, sortField, sortDirection]);

  // Paginated records
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let totalSalesVolume = 0;
    let totalUnitsSold = 0;
    let uniqueProductsCount = reportData.length;

    reportData.forEach((rec) => {
      totalSalesVolume += Number(rec.total_sales) || 0;
      totalUnitsSold += Number(rec.total_units_sold) || 0;
    });

    return { totalSalesVolume, totalUnitsSold, uniqueProductsCount };
  }, [reportData]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      showToast("No records available to export", "error");
      return;
    }

    const headers = ["Product Name", "Product Variant ID", "Unit Of Measure", "Total Units Sold", "Total Sales"];
    const rows = filteredRecords.map((rec) => [
      rec.product_name || "N/A",
      rec.product_variant_id || "N/A",
      rec.unit_of_measure || "N/A",
      rec.total_units_sold,
      `INR ${rec.total_sales}`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Inventory_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportOpen(false);
    showToast("CSV Exported successfully!");
  };

  return (
    <div className="min-h-screen bg-[#f4f7fe] p-4 sm:p-6 lg:p-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            View Inventory Report
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track and analyze product variants sales volume, inventory valuation, and unit velocities.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm self-start">
          <Link to="/admin" className="hover:text-purple-600 transition-colors">Home</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800">Inventory Report</span>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Metric 1 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Accumulated Product Sales</span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">
              ₹{summaryMetrics.totalSalesVolume.toLocaleString("en-IN")}
            </h3>
            <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded-full mt-3 inline-flex items-center gap-1">
              <TrendingUp size={10} /> Sourced Spice Sales
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300">
            ₹
          </div>
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-purple-50/30 rounded-full z-0 group-hover:scale-125 transition-transform duration-500" />
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Units Dispatched</span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">
              {summaryMetrics.totalUnitsSold.toLocaleString("en-IN")} Units
            </h3>
            <span className="text-[10px] text-purple-500 font-bold bg-purple-50 px-2 py-0.5 rounded-full mt-3 inline-flex items-center gap-1">
              📦 High Volume Velocity
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300">
            <ShoppingBag size={20} />
          </div>
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-emerald-50/30 rounded-full z-0 group-hover:scale-125 transition-transform duration-500" />
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Distinct Variant Stocks</span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">
              {summaryMetrics.uniqueProductsCount} Items Sourced
            </h3>
            <span className="text-[10px] text-cyan-500 font-bold bg-cyan-50 px-2 py-0.5 rounded-full mt-3 inline-flex items-center gap-1">
              🧬 Packaged Unit Weights
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300">
            <Layers size={20} />
          </div>
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-cyan-50/30 rounded-full z-0 group-hover:scale-125 transition-transform duration-500" />
        </div>
      </div>

      {/* FILTER & TABLE CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* CONTROLS & TABLE ACTION BAR */}
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider self-start sm:self-center">
            Database Stock Velocity
          </h2>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* SEARCH INPUT */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search..."
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-purple-400 placeholder-slate-400 text-slate-700 shadow-inner"
              />
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Refresh */}
            <button
              onClick={fetchReport}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-purple-600 transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Refresh Report"
            >
              <RefreshCw size={17} className={loading ? "animate-spin text-purple-500" : ""} />
            </button>

            {/* Columns Toggle */}
            <div className="relative" ref={columnsRef}>
              <button
                onClick={() => setIsColumnsOpen(!isColumnsOpen)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-purple-600 font-semibold text-xs tracking-wide transition shadow-sm cursor-pointer"
                title="Configure Columns"
              >
                <SlidersHorizontal size={14} />
                Columns
                <ChevronDown size={12} />
              </button>

              {isColumnsOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-100 shadow-2xl p-4 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                  <h4 className="font-bold text-xs text-slate-800 border-b pb-2 mb-2">Show/Hide Columns</h4>
                  <div className="space-y-2">
                    {Object.entries({
                      productName: "Product Name",
                      variantId: "Product Variant ID",
                      unitOfMeasure: "Unit Of Measure",
                      totalUnitsSold: "Total Units Sold",
                      totalSales: "Total Sales"
                    }).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2.5 text-xs text-slate-600 font-medium cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={activeColumns[key]}
                          onChange={() => setActiveColumns((p) => ({ ...p, [key]: !p[key] }))}
                          className="w-4 h-4 rounded border-slate-200 text-purple-600 focus:ring-purple-400"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Export Dropdown */}
            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs tracking-wide transition shadow-md cursor-pointer active:scale-98"
                title="Export Data"
              >
                <Download size={14} />
                Export
                <ChevronDown size={12} />
              </button>

              {isExportOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={handleExportCSV}
                    className="w-full text-left px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-purple-600 border-none bg-transparent cursor-pointer flex items-center gap-2"
                  >
                    <Download size={13} />
                    Export as CSV
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* INVENTORIES DATA TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                {activeColumns.productName && (
                  <th onClick={() => handleSort("product_name")} className="px-6 py-4 cursor-pointer hover:bg-slate-50 transition select-none min-w-[200px]">
                    <span className="flex items-center gap-1">PRODUCT NAME {sortField === "product_name" && (sortDirection === "asc" ? "▲" : "▼")}</span>
                  </th>
                )}
                {activeColumns.variantId && (
                  <th onClick={() => handleSort("product_variant_id")} className="px-6 py-4 cursor-pointer hover:bg-slate-50 transition select-none">
                    <span className="flex items-center gap-1">PRODUCT VARIANT ID {sortField === "product_variant_id" && (sortDirection === "asc" ? "▲" : "▼")}</span>
                  </th>
                )}
                {activeColumns.unitOfMeasure && (
                  <th onClick={() => handleSort("unit_of_measure")} className="px-6 py-4 cursor-pointer hover:bg-slate-50 transition select-none">
                    <span className="flex items-center gap-1">UNIT OF MEASURE {sortField === "unit_of_measure" && (sortDirection === "asc" ? "▲" : "▼")}</span>
                  </th>
                )}
                {activeColumns.totalUnitsSold && (
                  <th onClick={() => handleSort("total_units_sold")} className="px-6 py-4 cursor-pointer hover:bg-slate-50 transition select-none">
                    <span className="flex items-center gap-1">TOTAL UNITS SOLD {sortField === "total_units_sold" && (sortDirection === "asc" ? "▲" : "▼")}</span>
                  </th>
                )}
                {activeColumns.totalSales && (
                  <th onClick={() => handleSort("total_sales")} className="px-6 py-4 cursor-pointer hover:bg-slate-50 transition select-none min-w-[150px]">
                    <span className="flex items-center gap-1">TOTAL SALES (₹) {sortField === "total_sales" && (sortDirection === "asc" ? "▲" : "▼")}</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-20 bg-white">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 size={36} className="text-purple-600 animate-spin" />
                      <p className="text-slate-400 text-xs font-bold tracking-wide uppercase">Calculating Stock Metrics…</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 bg-white text-slate-400 italic">
                    No matching records found
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((rec, idx) => (
                  <tr key={`${rec.product_variant_id}-${idx}`} className="hover:bg-slate-50/50 transition duration-150">
                    {activeColumns.productName && (
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {rec.product_name}
                      </td>
                    )}
                    {activeColumns.variantId && (
                      <td className="px-6 py-4 text-slate-500 font-mono">
                        #{rec.product_variant_id || "N/A"}
                      </td>
                    )}
                    {activeColumns.unitOfMeasure && (
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 font-bold rounded-lg text-xs border border-purple-100">
                          {rec.unit_of_measure || "Standard Unit"}
                        </span>
                      </td>
                    )}
                    {activeColumns.totalUnitsSold && (
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {Number(rec.total_units_sold).toLocaleString("en-IN")} Units
                      </td>
                    )}
                    {activeColumns.totalSales && (
                      <td className="px-6 py-4 text-purple-700 font-black">
                        ₹{Number(rec.total_sales || 0).toLocaleString("en-IN")}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* BOTTOM PAGINATION BAR */}
        {!loading && filteredRecords.length > 0 && (
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} records
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer transition shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-9 h-9 rounded-lg font-bold text-xs transition border cursor-pointer ${
                    currentPage === idx + 1
                      ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-200"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer transition shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* TOAST SYSTEM */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[999] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl text-white text-xs font-bold tracking-wide uppercase border ${
            toast.type === "error"
              ? "bg-rose-600 border-rose-500 shadow-rose-200"
              : "bg-purple-600 border-purple-500 shadow-purple-200"
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="bg-transparent border-none text-white cursor-pointer p-0">
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
