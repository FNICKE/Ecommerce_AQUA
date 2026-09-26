import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../../store/toastStore';
import api from '../../lib/api';
import { Phone, Mail, MapPin, RotateCcw, Save, Info } from 'lucide-react';

function toMonSatParts(value) {
  const str = String(value ?? '');
  if (!str) return { label: 'Mon - Sat', time: '9:00 AM - 7:00 PM' };
  const [label, time] = str.split('|');
  return { label: (label || 'Mon - Sat').trim(), time: (time || '9:00 AM - 7:00 PM').trim() };
}

function toSundayParts(value) {
  const str = String(value ?? '');
  if (!str) return { label: 'Sunday', note: 'By Appointment' };
  const [label, note] = str.split('|');
  return { label: (label || 'Sunday').trim(), note: (note || 'By Appointment').trim() };
}

function richToTextOrEmpty(value) {
  return String(value ?? '');
}

export default function ContactEditor() {
  const navigate = useNavigate();
  const { showToast } = useToastStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [initial, setInitial] = useState(null);
  const [form, setForm] = useState({
    phone: '',
    email: '',
    address: '',
    intro_text: '',
    areas_we_deliver: '',
    delivery_timings: '',
    response_time: '',

    mon_sat_label: 'Mon - Sat',
    mon_sat_time: '9:00 AM - 7:00 PM',
    sunday_label: 'Sunday',
    sunday_note: 'By Appointment',

    headquarters_title: 'Headquarters',
    headquarters_description: '',
    headquarters_address: '',
    website: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/config/public');
        const cfg = res.data || {};
        const contactInfo = cfg.contact_info || {};
        const page = cfg.contact_page || {};

        const monSat = toMonSatParts(page.business_hours_mon_sat);
        const sun = toSundayParts(page.business_hours_sunday);

        const next = {
          phone: contactInfo.phone || '',
          email: contactInfo.email || '',
          address: contactInfo.address || '',
          intro_text: richToTextOrEmpty(page.intro_text),
          areas_we_deliver: richToTextOrEmpty(page.areas_we_deliver),
          delivery_timings: richToTextOrEmpty(page.delivery_timings),
          response_time: richToTextOrEmpty(page.response_time),

          mon_sat_label: monSat.label,
          mon_sat_time: monSat.time,
          sunday_label: sun.label,
          sunday_note: sun.note,

          headquarters_title: richToTextOrEmpty(page.headquarters_title) || 'Headquarters',
          headquarters_description: richToTextOrEmpty(page.headquarters_description),
          headquarters_address: richToTextOrEmpty(page.headquarters_address),
          website: richToTextOrEmpty(page.website),
        };

        setInitial(next);
        setForm(next);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to load contact info', 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [showToast]);

  const canSave = useMemo(() => {
    return Boolean(form.phone.trim() && form.email.trim() && form.address.trim());
  }, [form.phone, form.email, form.address]);

  const handleReset = () => {
    if (!initial) return;
    setForm(initial);
    showToast('Reset to saved values', 'info');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/config/contact', {
        phone: form.phone,
        email: form.email,
        address: form.address,
        intro_text: form.intro_text,
        areas_we_deliver: form.areas_we_deliver,
        delivery_timings: form.delivery_timings,
        response_time: form.response_time,

        business_hours_mon_sat: `${form.mon_sat_label}|${form.mon_sat_time}`,
        business_hours_sunday: `${form.sunday_label}|${form.sunday_note}`,

        headquarters_title: form.headquarters_title,
        headquarters_description: form.headquarters_description,
        headquarters_address: form.headquarters_address,
        website: form.website,
      });

      showToast('Contact info updated successfully', 'success');
      navigate(0); // reload editor values from backend defaults after save
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save contact info', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#F8F9FB] p-4 flex items-center justify-center">
        <Info size={22} className="text-purple-600 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F8F9FB] p-6 font-sans overflow-hidden flex flex-col">
      <div className="mb-5 flex items-center gap-2 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white rounded shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <RotateCcw size={18} className="text-purple-600" />
        </button>
        <h1 className="text-base font-bold text-[#334257]">Contact Us</h1>
      </div>

      <div className="flex flex-1 gap-5 min-h-0 overflow-hidden">
        <div className="w-[260px] flex flex-col gap-2 shrink-0">
          <div className="bg-white p-3 rounded-xl border border-purple-500 flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded text-purple-600">
              <Phone size={14} />
            </div>
            <span className="text-[11px] font-bold text-[#334257]">Contact us editor</span>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden shadow-sm">
          <div className="p-6 flex-1 overflow-auto space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Email</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Address</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                className="w-full px-4 py-2 bg-[#F9FBFC] border border-[#E8ECEF] rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400 min-h-[60px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Intro text (HTML supported)</label>
              <textarea
                value={form.intro_text}
                onChange={(e) => setForm((p) => ({ ...p, intro_text: e.target.value }))}
                className="w-full px-4 py-2 bg-[#F9FBFC] border border-[#E8ECEF] rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400 min-h-[90px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Areas we deliver (HTML supported)</label>
                <textarea
                  value={form.areas_we_deliver}
                  onChange={(e) => setForm((p) => ({ ...p, areas_we_deliver: e.target.value }))}
                  className="w-full px-4 py-2 bg-[#F9FBFC] border border-[#E8ECEF] rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400 min-h-[110px]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Delivery timings (HTML supported)</label>
                <textarea
                  value={form.delivery_timings}
                  onChange={(e) => setForm((p) => ({ ...p, delivery_timings: e.target.value }))}
                  className="w-full px-4 py-2 bg-[#F9FBFC] border border-[#E8ECEF] rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400 min-h-[110px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Mon - Sat label</label>
                <input
                  value={form.mon_sat_label}
                  onChange={(e) => setForm((p) => ({ ...p, mon_sat_label: e.target.value }))}
                  className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Mon - Sat time</label>
                <input
                  value={form.mon_sat_time}
                  onChange={(e) => setForm((p) => ({ ...p, mon_sat_time: e.target.value }))}
                  className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Sunday label</label>
                <input
                  value={form.sunday_label}
                  onChange={(e) => setForm((p) => ({ ...p, sunday_label: e.target.value }))}
                  className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Sunday note</label>
                <input
                  value={form.sunday_note}
                  onChange={(e) => setForm((p) => ({ ...p, sunday_note: e.target.value }))}
                  className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Response time text</label>
              <input
                value={form.response_time}
                onChange={(e) => setForm((p) => ({ ...p, response_time: e.target.value }))}
                className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400"
              />
            </div>

            <div className="bg-slate-50 border border-gray-100 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                <MapPin size={18} className="text-purple-600" />
                Headquarters section
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Title</label>
                <input
                  value={form.headquarters_title}
                  onChange={(e) => setForm((p) => ({ ...p, headquarters_title: e.target.value }))}
                  className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Description</label>
                <textarea
                  value={form.headquarters_description}
                  onChange={(e) => setForm((p) => ({ ...p, headquarters_description: e.target.value }))}
                  className="w-full px-4 py-2 bg-[#F9FBFC] border border-[#E8ECEF] rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400 min-h-[90px]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Address</label>
                <textarea
                  value={form.headquarters_address}
                  onChange={(e) => setForm((p) => ({ ...p, headquarters_address: e.target.value }))}
                  className="w-full px-4 py-2 bg-[#F9FBFC] border border-[#E8ECEF] rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400 min-h-[70px]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Website</label>
                <input
                  value={form.website}
                  onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                  className="w-full bg-[#F9FBFC] border border-[#E8ECEF] px-4 py-2 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-purple-400"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="px-5 py-2 text-[11px] font-bold text-gray-400 flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || saving}
              className="px-8 py-2 bg-[#004BB9] text-white rounded-lg text-[11px] font-bold shadow-lg shadow-blue-100 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save size={14} /> {saving ? 'Saving...' : 'Update Contact Info'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

