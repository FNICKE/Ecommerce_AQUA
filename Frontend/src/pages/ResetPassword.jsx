import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../lib/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/reset-password', { token: searchParams.get('token'), newPassword });
      setMessage(response.data.message);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center mb-8">Set New Password</h2>
        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6 text-sm">{error}</div>}
        {message && <div className="bg-green-100 text-green-700 p-4 rounded mb-6 text-sm">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-3 px-4" placeholder="At least 6 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-3 px-4" placeholder="Re-enter your password" />
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600"><Link to="/login" className="text-indigo-600 hover:underline">Back to Login</Link></p>
      </div>
    </div>
  );
}