import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send reset link. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center mb-3">Forgot Password</h2>
        <p className="text-center text-gray-600 mb-8">Enter your account email and we will send a reset link.</p>
        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6 text-sm">{error}</div>}
        {message && <div className="bg-green-100 text-green-700 p-4 rounded mb-6 text-sm">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-3 px-4" placeholder="Enter your email" />
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600"><Link to="/login" className="text-indigo-600 hover:underline">Back to Login</Link></p>
      </div>
    </div>
  );
}