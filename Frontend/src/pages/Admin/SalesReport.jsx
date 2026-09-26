import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Download,
  Calendar,
  ChevronDown,
  Check,
  Printer,
  Eye,
  X,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  ShoppingCart as CartIcon,
  ShoppingBag
} from "lucide-react";
import api from "../../lib/api";
import { getImageUrl } from "../../lib/imageUrl";

export default function SalesReport() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState("all");
  const [globalSearch, setGlobalSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");
  
  // Date Dropdown State
  const [isDateOpen, setIsDateOpen] = useState(false);
  const dateRef = useRef(null);

  // Table & Action States
  const [sortField, setSortField] = useState("date_added");
  const [sortDirection, setSortDirection] = useState("desc");
  const [activeColumns, setActiveColumns] = useState({
    orderId: true,
    userName: true,
    mobile: true,
    address: true,
    finalTotal: true,
    status: true,
    orderDate: true,
    operate: true
  });
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const columnsRef = useRef(null);
  const exportRef = useRef(null);
  
  // Modal State for Invoice Details
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Toast State
  const [toast, setToast] = useState(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dateRef.current && !dateRef.current.contains(event.target)) {
        setIsDateOpen(false);
      }
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

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (appliedFromDate) params.from_date = appliedFromDate;
      if (appliedToDate) params.to_date = appliedToDate;
      
      const res = await api.get("/orders/admin/all", { params });
      if (res.data?.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error("Failed to fetch sales invoices:", err);
      showToast("Failed to fetch sales invoices", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, appliedFromDate, appliedToDate]);

  // Toast Helper
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Date Selection Handlers
  const handleApplyDateRange = () => {
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setIsDateOpen(false);
    setCurrentPage(1);
    showToast("Date range applied successfully");
  };

  const handleClearDateRange = () => {
    setFromDate("");
    setToDate("");
    setAppliedFromDate("");
    setAppliedToDate("");
    setIsDateOpen(false);
    setCurrentPage(1);
    showToast("Date range cleared");
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

  // Filtered & Sorted Invoices list
  const filteredInvoices = useMemo(() => {
    let result = [...orders];

    // Global Search Filter
    if (globalSearch.trim()) {
      const query = globalSearch.toLowerCase();
      result = result.filter(
        (invoice) =>
          String(invoice.id).toLowerCase().includes(query) ||
          String(invoice.customer_name || "").toLowerCase().includes(query) ||
          String(invoice.mobile || "").toLowerCase().includes(query) ||
          String(invoice.address || "").toLowerCase().includes(query) ||
          String(invoice.status || "").toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "id") {
        aVal = Number(a.id);
        bVal = Number(b.id);
      } else if (sortField === "final_total") {
        aVal = Number(a.final_total);
        bVal = Number(b.final_total);
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [orders, globalSearch, sortField, sortDirection]);

  // Pagination helper
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInvoices, currentPage]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  // Status Colors helper
  const getStatusBadgeClass = (status) => {
    const normalized = String(status || "").toLowerCase();
    switch (normalized) {
      case "delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "received":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "processed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "shipped":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // View Invoice detail
  const handleViewInvoice = async (order) => {
    setSelectedOrder(order);
    setInvoiceLoading(true);
    setInvoiceItems([]);
    try {
      const res = await api.get(`/orders/admin/${order.id}`);
      if (res.data?.success) {
        setInvoiceItems(res.data.items || []);
      }
    } catch (err) {
      console.error("Error fetching order invoice items:", err);
      showToast("Failed to load invoice items", "error");
    } finally {
      setInvoiceLoading(false);
    }
  };

  // Trigger browser print
  const handlePrint = () => {
    const printContent = document.getElementById("invoice-print-area");
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    
    // Re-bind listeners by reloading or re-rendering state
    window.location.reload();
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      showToast("No records available to export", "error");
      return;
    }
    
    const headers = ["Order ID", "User Name", "Mobile", "Address", "Final Total", "Status", "Order Date"];
    const rows = filteredInvoices.map(inv => [
      inv.id,
      inv.customer_name || "N/A",
      inv.mobile || "N/A",
      inv.address || "N/A",
      `INR ${inv.final_total}`,
      inv.status.toUpperCase(),
      new Date(inv.date_added).toLocaleDateString("en-IN")
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sales_Invoice_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportOpen(false);
    showToast("CSV Exported successfully!");
  };

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let totalSales = 0;
    let pendingSales = 0;
    let ordersCount = filteredInvoices.length;

    filteredInvoices.forEach(inv => {
      const val = Number(inv.final_total) || 0;
      totalSales += val;
      if (String(inv.status).toLowerCase() !== "delivered" && String(inv.status).toLowerCase() !== "cancelled") {
        pendingSales += val;
      }
    });

    return { totalSales, pendingSales, ordersCount };
  }, [filteredInvoices]);

  return (
    <div className="min-h-screen bg-[#f4f7fe] p-4 sm:p-6 lg:p-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            View Sales Invoice
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate and analyze invoices, receipts, and order performance.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm self-start">
          <Link to="/admin" className="hover:text-purple-600 transition-colors">Home</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800">Sales Invoice</span>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Metric 1 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales Revenue</span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">
              ₹{summaryMetrics.totalSales.toLocaleString("en-IN")}
            </h3>
            <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded-full mt-3 inline-flex items-center gap-1">
              <TrendingUp size={10} /> Active Sales Base
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300">
            <DollarSign size={22} />
          </div>
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-purple-50/30 rounded-full z-0 group-hover:scale-125 transition-transform duration-500" />
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pipeline (Pending) Revenue</span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">
              ₹{summaryMetrics.pendingSales.toLocaleString("en-IN")}
            </h3>
            <span className="text-[10px] text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded-full mt-3 inline-flex items-center gap-1">
              • Processing / Shipped
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300">
            <ShoppingBag size={22} />
          </div>
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-cyan-50/30 rounded-full z-0 group-hover:scale-125 transition-transform duration-500" />
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales Transactions</span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">
              {summaryMetrics.ordersCount} Invoices
            </h3>
            <span className="text-[10px] text-purple-500 font-bold bg-purple-50 px-2 py-0.5 rounded-full mt-3 inline-flex items-center gap-1">
              🧾 Dynamic Database Count
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300">
            <CartIcon size={22} />
          </div>
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-emerald-50/30 rounded-full z-0 group-hover:scale-125 transition-transform duration-500" />
        </div>
      </div>

      {/* FILTER & TABLE CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* TOP FILTER ACTION BAR */}
        <div className="p-6 border-b border-slate-100 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
            
            {/* DATE RANGE FILTER */}
            <div className="lg:col-span-4" ref={dateRef}>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Date range:
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDateOpen(!isDateOpen)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 font-medium hover:border-purple-300 transition shadow-sm text-left focus:outline-none"
                >
                  <Calendar size={18} className="text-slate-400 shrink-0" />
                  <span className="truncate flex-1">
                    {appliedFromDate && appliedToDate
                      ? `${appliedFromDate} to ${appliedToDate}`
                      : "Select Date Range To Filter"}
                  </span>
                  <ChevronDown size={15} className="text-slate-400 shrink-0" />
                </button>

                {/* Floating Date Selector Card */}
                {isDateOpen && (
                  <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl border border-slate-100 shadow-2xl p-5 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                    <h4 className="font-bold text-sm text-slate-800 mb-3">Custom Date Range</h4>
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">From Date</label>
                        <input
                          type="date"
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">To Date</label>
                        <input
                          type="date"
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-5">
                      <button
                        type="button"
                        onClick={handleClearDateRange}
                        className="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border-none cursor-pointer transition"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyDateRange}
                        className="flex-1 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl border-none cursor-pointer transition"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* STATUS FILTER */}
            <div className="lg:col-span-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Filter By status:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 font-medium hover:border-purple-300 transition shadow-sm focus:outline-none cursor-pointer appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M6 9l6 6 6-6'/></svg>")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 16px center",
                  backgroundSize: "16px"
                }}
              >
                <option value="all">All Orders</option>
                <option value="received">Received</option>
                <option value="processed">Processed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* SEARCH BUTTON */}
            <div className="lg:col-span-2">
              <button
                type="button"
                onClick={fetchOrders}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-transparent hover:bg-purple-50 text-purple-700 border-2 border-purple-200 hover:border-purple-300 font-bold text-sm transition cursor-pointer active:scale-98"
              >
                <Search size={16} />
                Search
              </button>
            </div>
          </div>
        </div>

        {/* CONTROLS & TABLE ACTION BAR */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* SEARCH INPUT */}
          <div className="relative w-full sm:w-72">
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

          {/* DYNAMIC UTILITIES */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto self-end sm:self-center justify-end">
            
            {/* Refresh */}
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-purple-600 transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Refresh Invoices"
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
                      orderId: "Order ID",
                      userName: "User Name",
                      mobile: "Mobile",
                      address: "Address",
                      finalTotal: "Final Total",
                      status: "Status",
                      orderDate: "Order Date",
                      operate: "Operate"
                    }).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2.5 text-xs text-slate-600 font-medium cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={activeColumns[key]}
                          onChange={() => setActiveColumns(p => ({ ...p, [key]: !p[key] }))}
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

        {/* INVOICES DATA TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                {activeColumns.orderId && (
                  <th onClick={() => handleSort("id")} className="px-6 py-4 cursor-pointer hover:bg-slate-50 transition select-none min-w-[120px]">
                    <span className="flex items-center gap-1">ORDER ID {sortField === "id" && (sortDirection === "asc" ? "▲" : "▼")}</span>
                  </th>
                )}
                {activeColumns.userName && (
                  <th onClick={() => handleSort("customer_name")} className="px-6 py-4 cursor-pointer hover:bg-slate-50 transition select-none">
                    <span className="flex items-center gap-1">USER NAME {sortField === "customer_name" && (sortDirection === "asc" ? "▲" : "▼")}</span>
                  </th>
                )}
                {activeColumns.mobile && (
                  <th onClick={() => handleSort("mobile")} className="px-6 py-4 cursor-pointer hover:bg-slate-50 transition select-none">
                    <span className="flex items-center gap-1">MOBILE {sortField === "mobile" && (sortDirection === "asc" ? "▲" : "▼")}</span>
                  </th>
                )}
                {activeColumns.address && (
                  <th className="px-6 py-4 select-none min-w-[200px]">ADDRESS</th>
                )}
                {activeColumns.finalTotal && (
                  <th onClick={() => handleSort("final_total")} className="px-6 py-4 cursor-pointer hover:bg-slate-50 transition select-none">
                    <span className="flex items-center gap-1">FINAL TOTAL(₹) {sortField === "final_total" && (sortDirection === "asc" ? "▲" : "▼")}</span>
                  </th>
                )}
                {activeColumns.status && (
                  <th onClick={() => handleSort("status")} className="px-6 py-4 cursor-pointer hover:bg-slate-50 transition select-none">
                    <span className="flex items-center gap-1">STATUS {sortField === "status" && (sortDirection === "asc" ? "▲" : "▼")}</span>
                  </th>
                )}
                {activeColumns.orderDate && (
                  <th onClick={() => handleSort("date_added")} className="px-6 py-4 cursor-pointer hover:bg-slate-50 transition select-none min-w-[140px]">
                    <span className="flex items-center gap-1">ORDER DATE {sortField === "date_added" && (sortDirection === "asc" ? "▲" : "▼")}</span>
                  </th>
                )}
                {activeColumns.operate && (
                  <th className="px-6 py-4 select-none text-center">OPERATE</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-20 bg-white">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw size={36} className="text-purple-600 animate-spin" />
                      <p className="text-slate-400 text-xs font-bold tracking-wide uppercase">Retrieving Invoices…</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 bg-white text-slate-400 italic">
                    No matching records found
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50/50 transition duration-150">
                    {activeColumns.orderId && (
                      <td className="px-6 py-4 font-bold text-slate-800">
                        #{invoice.id}
                      </td>
                    )}
                    {activeColumns.userName && (
                      <td className="px-6 py-4 text-slate-700 max-w-[150px] truncate">
                        {invoice.customer_name || "Guest Customer"}
                      </td>
                    )}
                    {activeColumns.mobile && (
                      <td className="px-6 py-4 text-slate-500 font-mono">
                        {invoice.mobile || invoice.customer_mobile || "N/A"}
                      </td>
                    )}
                    {activeColumns.address && (
                      <td className="px-6 py-4 text-slate-500 max-w-[220px] truncate" title={invoice.address}>
                        {invoice.address || "N/A"}
                      </td>
                    )}
                    {activeColumns.finalTotal && (
                      <td className="px-6 py-4 text-slate-900 font-black">
                        ₹{Number(invoice.final_total || 0).toLocaleString("en-IN")}
                      </td>
                    )}
                    {activeColumns.status && (
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusBadgeClass(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                    )}
                    {activeColumns.orderDate && (
                      <td className="px-6 py-4 text-slate-500 text-xs font-bold">
                        {new Date(invoice.date_added).toLocaleString("en-IN", {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    )}
                    {activeColumns.operate && (
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border-none cursor-pointer transition"
                        >
                          <Eye size={13} />
                          Invoice
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* BOTTOM PAGINATION BAR */}
        {!loading && filteredInvoices.length > 0 && (
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} invoices
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

      {/* DETAILED INVOICE DIALOG MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-8 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="bg-purple-600 text-white text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider">
                  Invoice
                </span>
                <span className="text-slate-800 font-bold text-base">
                  Order #{selectedOrder.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 rounded-full transition cursor-pointer border-none bg-transparent"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable invoice area */}
            <div className="flex-1 overflow-y-auto p-8" id="invoice-print-area">
              
              {/* BRAND HEADER & METADATA */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b pb-6 border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-md">
                      A
                    </div>
                    <h2 className="font-serif font-black text-xl text-slate-800 tracking-tight">
                      {window.siteName || 'Store'}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-medium">
                    {window.siteTitle || 'General Store'}<br />
                    Navi Mumbai, Maharashtra, India.
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <h3 className="text-lg font-black text-slate-800 tracking-wide uppercase">Sales Invoice</h3>
                  <div className="mt-2 space-y-1 text-xs text-slate-500 font-medium">
                    <p><span className="text-slate-400">Invoice No:</span> #{selectedOrder.id}</p>
                    <p>
                      <span className="text-slate-400">Date:</span>{" "}
                      {new Date(selectedOrder.date_added).toLocaleDateString("en-IN", {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p><span className="text-slate-400">Payment:</span> <span className="uppercase text-purple-600 font-bold">{selectedOrder.payment_method}</span></p>
                    <p><span className="text-slate-400">Status:</span> <span className="uppercase font-bold text-slate-700">{selectedOrder.status}</span></p>
                  </div>
                </div>
              </div>

              {/* BILLING & CLIENT DETAIL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-b border-slate-100 text-xs font-medium">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Customer details</h4>
                  <div className="space-y-1.5 text-slate-700">
                    <p className="font-bold text-slate-900 text-sm">{selectedOrder.customer_name || "Guest Customer"}</p>
                    <p className="text-slate-500">{selectedOrder.customer_email || "No Email Provided"}</p>
                    <p className="text-slate-500 font-mono">{selectedOrder.mobile || selectedOrder.customer_mobile || "N/A"}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Delivery address</h4>
                  <p className="text-slate-700 leading-relaxed max-w-sm">
                    {selectedOrder.address || "No shipping address details found."}
                  </p>
                </div>
              </div>

              {/* PRODUCTS LIST TABLE */}
              <div className="py-6">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Invoice items</h4>
                
                {invoiceLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw size={24} className="text-purple-500 animate-spin mx-auto" />
                    <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-wide">Retrieving Items…</p>
                  </div>
                ) : invoiceItems.length === 0 ? (
                  <p className="text-slate-400 italic text-xs py-4">No itemized product listings found for this invoice.</p>
                ) : (
                  <table className="w-full text-left text-xs font-medium border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-2.5">Item description</th>
                        <th className="py-2.5">Unit/Weight</th>
                        <th className="py-2.5 text-center">Qty</th>
                        <th className="py-2.5 text-right">Price</th>
                        <th className="py-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {invoiceItems.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="py-3 font-bold text-slate-800">
                            {item.product_name}
                          </td>
                          <td className="py-3 text-slate-400">
                            {item.variant_name || item.weight || "Standard Unit"}
                          </td>
                          <td className="py-3 text-center font-bold">
                            {item.qty}
                          </td>
                          <td className="py-3 text-right">
                            ₹{Number(item.price || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 text-right font-bold text-slate-900">
                            ₹{(Number(item.price || 0) * Number(item.qty || 1)).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* CALCULATION SUMMARY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100 text-xs">
                <div>
                  {selectedOrder.notes && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Order Notes</h4>
                      <p className="text-slate-600 leading-relaxed">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2.5 text-slate-600 font-medium">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-slate-800">₹{Number(selectedOrder.total || 0).toLocaleString("en-IN")}</span>
                  </div>
                  {Number(selectedOrder.delivery_charge) > 0 && (
                    <div className="flex justify-between">
                      <span>Delivery Charge:</span>
                      <span className="text-slate-800">+₹{Number(selectedOrder.delivery_charge).toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {Number(selectedOrder.promo_discount) > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Promo Discount ({selectedOrder.promo_code}):</span>
                      <span>-₹{Number(selectedOrder.promo_discount).toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {Number(selectedOrder.wallet_balance) > 0 && (
                    <div className="flex justify-between text-indigo-600">
                      <span>Wallet Balance Used:</span>
                      <span>-₹{Number(selectedOrder.wallet_balance).toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-dashed">
                    <span>Grand Total:</span>
                    <span className="text-purple-700">₹{Number(selectedOrder.final_total || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-700 font-bold text-xs cursor-pointer transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-purple-100 transition active:scale-98"
              >
                <Printer size={14} />
                Print Invoice
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
