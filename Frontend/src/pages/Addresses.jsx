import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { MapPin, Phone, User, Trash2, ArrowLeft, ArrowRight, ShieldCheck, Home, Briefcase, Plus, Loader } from 'lucide-react';
import api from '../lib/api';
import { useToastStore } from '../store/toastStore';

const initialForm = {
  name: '',
  type: 'home',
  mobile: '',
  alternate_mobile: '',
  address: '',
  landmark: '',
  city: '',
  area: '',
  pincode: '',
  state: '',
  country: 'India',
  is_default: 1,
};

export default function Addresses() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToastStore();
  const returnTo = useMemo(() => location.state?.returnTo || '/checkout', [location.state]);

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data.addresses || []);
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to load addresses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? (checked ? 1 : 0) : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        is_default: Number(form.is_default) ? 1 : 0,
      };
      const res = await api.post('/addresses', payload);
      const newId = res.data.addressId;

      showToast('Address saved successfully!', 'success');
      await fetchAddresses();
      setForm(initialForm);
      navigate(returnTo, { state: { selectedAddressId: newId } });
    } catch (e2) {
      showToast(e2.response?.data?.message || 'Failed to save address', 'error');
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id) => {
    try {
      await api.put(`/addresses/${id}/default`);
      showToast('Default address updated!', 'success');
      await fetchAddresses();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to set default address', 'error');
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/addresses/${id}`);
      showToast('Address deleted successfully!', 'success');
      await fetchAddresses();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to delete address', 'error');
    }
  };

  return (
    <div className="bg-[#f8f9fc] min-h-screen py-12">
      {/* Header and Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <nav className="flex items-center text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400 mb-3 select-none">
              <Link to="/products" className="hover:text-indigo-600 transition-colors">Shop</Link>
              <span className="mx-3">/</span>
              <span className="text-slate-900">Addresses</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">My Addresses</h1>
          </div>
          <button
            onClick={() => navigate(returnTo)}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold text-xs transition-all shadow-xl shadow-slate-200 select-none uppercase tracking-wider border-none cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to Checkout
          </button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Saved Addresses */}
          <div className="lg:col-span-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Home size={18} className="text-indigo-600" /> Saved Addresses
            </h3>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400 font-semibold select-none">
                <Loader className="animate-spin text-indigo-600 mb-2" size={28} />
                <span>Loading your addresses...</span>
              </div>
            ) : addresses.length === 0 ? (
              <div className="py-16 text-center text-gray-400 font-semibold select-none flex flex-col items-center justify-center gap-3">
                <MapPin className="text-gray-300" size={40} />
                <span>No saved addresses found.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {addresses.map((a) => (
                  <div key={a.id} className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm hover:border-purple-300 transition-all duration-300 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-extrabold text-gray-800 text-base">{a.name}</span>
                          <span className="text-[9px] font-bold tracking-wider uppercase bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100">{a.type}</span>
                          {a.is_default ? (
                            <span className="text-[9px] font-bold tracking-wider uppercase bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">
                              Default
                            </span>
                          ) : null}
                        </div>
                        <p className="text-gray-600 mt-3 font-medium leading-relaxed">{a.address}</p>
                        <p className="text-gray-500 mt-1 font-semibold">
                          {a.area ? `${a.area}, ` : ''}{a.city}, {a.state} - {a.pincode}
                        </p>
                        {a.landmark && (
                          <p className="text-gray-400 text-xs mt-1 font-semibold italic">Landmark: {a.landmark}</p>
                        )}
                        <p className="text-gray-500 mt-3.5 font-semibold flex items-center gap-1.5">
                          <Phone size={14} className="text-gray-400" /> Phone: {a.mobile} {a.alternate_mobile && `| Alt: ${a.alternate_mobile}`}
                        </p>
                      </div>

                      <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0 select-none pt-2 sm:pt-0">
                        {!a.is_default && (
                          <button
                            onClick={() => setDefault(a.id)}
                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-[10px] font-bold transition shadow-md border-none cursor-pointer uppercase"
                          >
                            Set default
                          </button>
                        )}
                        <button
                          onClick={() => remove(a.id)}
                          className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-[10px] font-bold transition cursor-pointer uppercase text-gray-500 border-none"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Add New Address */}
          <div className="lg:col-span-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Plus size={18} className="text-indigo-600" /> Add New Address
            </h3>

            <form onSubmit={submit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Recipient Name</label>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 focus-within:border-purple-600 focus-within:bg-white transition-all shadow-sm">
                    <User size={18} className="text-gray-400" />
                    <input className="w-full bg-transparent outline-none text-xs font-bold text-gray-800" name="name" value={form.name} onChange={onChange} required placeholder="Full Name" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Address Type</label>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 focus-within:border-purple-600 focus-within:bg-white transition-all shadow-sm">
                    <MapPin size={18} className="text-gray-400" />
                    <select className="w-full bg-transparent outline-none text-xs font-bold text-gray-700 bg-white" name="type" value={form.type} onChange={onChange}>
                      <option value="home">Home</option>
                      <option value="office">Office</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Mobile Phone</label>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 focus-within:border-purple-600 focus-within:bg-white transition-all shadow-sm">
                    <Phone size={18} className="text-gray-400" />
                    <input className="w-full bg-transparent outline-none text-xs font-bold text-gray-800" name="mobile" value={form.mobile} onChange={onChange} required placeholder="Mobile Number" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Alternate Phone</label>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 focus-within:border-purple-600 focus-within:bg-white transition-all shadow-sm">
                    <Phone size={18} className="text-gray-400" />
                    <input className="w-full bg-transparent outline-none text-xs font-bold text-gray-800" name="alternate_mobile" value={form.alternate_mobile} onChange={onChange} placeholder="Optional" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Street Address</label>
                <textarea 
                  className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 focus:border-purple-600 focus:bg-white outline-none text-xs font-bold text-gray-800 shadow-sm transition-all resize-y min-h-[90px]" 
                  name="address" 
                  value={form.address} 
                  onChange={onChange} 
                  required 
                  rows={3} 
                  placeholder="Flat / House No, Building, Street Name..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Landmark</label>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 focus-within:border-purple-600 focus-within:bg-white transition-all shadow-sm">
                    <MapPin size={18} className="text-gray-400" />
                    <input className="w-full bg-transparent outline-none text-xs font-bold text-gray-800" name="landmark" value={form.landmark} onChange={onChange} placeholder="e.g. Near Temple (Optional)" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Area / Locality</label>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 focus-within:border-purple-600 focus-within:bg-white transition-all shadow-sm">
                    <MapPin size={18} className="text-gray-400" />
                    <input className="w-full bg-transparent outline-none text-xs font-bold text-gray-800" name="area" value={form.area} onChange={onChange} required placeholder="e.g. Sector 15" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">City</label>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 focus-within:border-purple-600 focus-within:bg-white transition-all shadow-sm">
                    <input className="w-full bg-transparent outline-none text-xs font-bold text-gray-800" name="city" value={form.city} onChange={onChange} required placeholder="City" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">State</label>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 focus-within:border-purple-600 focus-within:bg-white transition-all shadow-sm">
                    <input className="w-full bg-transparent outline-none text-xs font-bold text-gray-800" name="state" value={form.state} onChange={onChange} required placeholder="State" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Pincode</label>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 focus-within:border-purple-600 focus-within:bg-white transition-all shadow-sm">
                    <input className="w-full bg-transparent outline-none text-xs font-bold text-gray-800" name="pincode" value={form.pincode} onChange={onChange} required placeholder="Pincode" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 select-none">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest cursor-pointer">
                  <input type="checkbox" name="is_default" checked={!!Number(form.is_default)} onChange={onChange} className="w-4 h-4 text-purple-600" />
                  Make default
                </label>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3.5 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs disabled:opacity-60 transition-all shadow-lg shadow-green-100 flex items-center gap-2 border-none cursor-pointer uppercase tracking-wider"
                >
                  {saving ? (
                    <>
                      <Loader className="animate-spin" size={14} /> Saving...
                    </>
                  ) : (
                    <>
                      Save Address <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
