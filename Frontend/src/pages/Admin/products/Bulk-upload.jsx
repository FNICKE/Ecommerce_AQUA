import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import api from '../../../lib/api';

export default function BulkUpload() {
  const [type, setType] = useState('upload');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState('');
  const [result, setResult] = useState(null);

  const resetForm = () => {
    setType('upload');
    setFile(null);
    setResult(null);
  };

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
  };

  const handleSubmit = async () => {
    if (!file) {
      alert('Please choose a CSV file');
      return;
    }

    try {
      setSubmitting(true);
      setResult(null);
      const formData = new FormData();
      formData.append('type', type);
      formData.append('file', file);

      const response = await api.post('/admin/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(response.data || null);
    } catch (error) {
      console.error('Bulk upload failed:', error);
      alert(error.response?.data?.message || 'Bulk upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadFile = async (url, fileName) => {
    try {
      setDownloading(fileName);
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      const href = window.URL.createObjectURL(blob);
      link.href = href;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(href);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    } finally {
      setDownloading('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#4e5e7a]">Bulk upload</h2>
        <p className="text-sm text-gray-500">
          Home / <span className="text-purple-600">Products</span>
        </p>
      </div>

      {/* Instructions Banner */}
      <div className="bg-[#e1f5fe] border border-[#b3e5fc] rounded-xl p-6">
        <ul className="space-y-2">
          <InstructionItem text="Read and follow instructions carefully while preparing data" />
          <InstructionItem text="Download and save the sample file to reduce errors" />
          <InstructionItem text="For adding bulk products file should be .csv format" />
          <InstructionItem text="You can copy image path from media section" />
          <InstructionItem text="Make sure you entered valid data as per instructions before proceed" />
        </ul>
      </div>

      {/* Upload Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Type Selection */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Type [Upload/Update] <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-purple-500 appearance-none bg-white"
              >
                <option value="upload">Upload</option>
                <option value="update">Update</option>
              </select>
              <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          {/* File Picker */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              File <span className="text-red-500">*</span>
            </label>
            <div className="flex items-stretch">
              <label className="cursor-pointer bg-white border border-gray-200 border-r-0 rounded-l-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Choose File
                <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
              </label>
              <div className="flex-1 border border-gray-200 rounded-r-lg px-4 py-2 text-sm text-gray-400 bg-gray-50/30 flex items-center">
                {file?.name || 'No file chosen'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="bg-[#ffc107] text-white px-6 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-[#e0a800] transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[#71dd37] text-white px-6 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-[#61be2f] transition-colors disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>

        {result && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
            <p className="font-semibold text-green-700 mb-2">Bulk operation completed</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-green-900">
              <StatCard label="Rows" value={result.totalRows ?? 0} />
              <StatCard label="Created" value={result.created ?? 0} />
              <StatCard label="Updated" value={result.updated ?? 0} />
              <StatCard label="Failed" value={result.failed ?? 0} />
            </div>
            {Array.isArray(result.errors) && result.errors.length > 0 && (
              <div className="mt-3 max-h-36 overflow-auto rounded border border-green-200 bg-white p-3 text-xs text-red-600">
                {result.errors.map((item, idx) => (
                  <div key={`${item}-${idx}`}>{item}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Download Resources Section */}
        <div className="pt-8 border-t border-gray-100">
          <div className="flex flex-wrap gap-3">
            <ResourceButton 
              label="Bulk upload sample file" 
              color="bg-[#00c5dc]" 
              disabled={downloading === 'bulk-upload-sample.csv'}
              onClick={() => downloadFile('/admin/bulk-upload/sample?type=upload', 'bulk-upload-sample.csv')}
              icon={<Download size={16} />} 
            />
            <ResourceButton 
              label="Bulk upload instructions" 
              color="bg-[#6f42c1]" 
              disabled={downloading === 'bulk-upload-instructions.txt'}
              onClick={() => downloadFile('/admin/bulk-upload/instructions?type=upload', 'bulk-upload-instructions.txt')}
              icon={<Download size={16} />} 
            />
            <ResourceButton 
              label="Bulk update sample file" 
              color="bg-[#00c5dc]" 
              disabled={downloading === 'bulk-update-sample.csv'}
              onClick={() => downloadFile('/admin/bulk-upload/sample?type=update', 'bulk-update-sample.csv')}
              icon={<Download size={16} />} 
            />
            <ResourceButton 
              label="Bulk update instructions" 
              color="bg-[#6f42c1]" 
              disabled={downloading === 'bulk-update-instructions.txt'}
              onClick={() => downloadFile('/admin/bulk-upload/instructions?type=update', 'bulk-update-instructions.txt')}
              icon={<Download size={16} />} 
            />
            <ResourceButton 
              label="Download Data" 
              color="bg-[#00c5dc]" 
              disabled={downloading === 'products-data.csv'}
              onClick={() => downloadFile('/admin/bulk-upload/data', 'products-data.csv')}
              icon={<Download size={16} />} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* Helper Components */

function InstructionItem({ text }) {
  return (
    <li className="flex items-center gap-2 text-[#00bcd4] text-sm font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-[#00bcd4]" />
      {text}
    </li>
  );
}

function ResourceButton({ label, color, icon, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${color} text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60`}
    >
      {label} {icon}
    </button>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-green-200 bg-white px-3 py-2">
      <div className="text-[11px] uppercase text-green-700">{label}</div>
      <div className="text-base font-bold text-green-900">{value}</div>
    </div>
  );
}

function ChevronDown({ size, className }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}