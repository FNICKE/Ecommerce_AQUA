import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

const schema = z.object({
  emailOrMobile: z.string().min(1, 'Required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Login({ mode = 'user' }) {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const isAdminLogin = mode === 'admin';

  // Password reset state (Admin only)
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(null);
  const [resetError, setResetError] = useState(null);
  const [isResettingSubmitting, setIsResettingSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      setError(null);
      const res = await api.post('/auth/login', data);
      const { user, token } = res.data;
      const isAdminUser = user.company === 'ADMIN';

      if (isAdminLogin && !isAdminUser) {
        setError('This page is only for admin accounts. Please use the user login page.');
        return;
      }

      if (!isAdminLogin && isAdminUser) {
        setError('Admin accounts must login from the admin page.');
        return;
      }

      login(user, token);
      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get('redirect');
      if (isAdminUser) {
        navigate('/admin');
      } else if (redirect) {
        navigate(`/${redirect}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (!resetEmail || !newPassword || !confirmPassword) {
      setResetError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters');
      return;
    }

    try {
      setIsResettingSubmitting(true);
      const res = await api.post('/auth/admin/reset-password', {
        email: resetEmail,
        newPassword
      });
      
      setResetSuccess(res.data?.message || 'Password reset successfully!');
      setResetEmail('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Navigate back to login form after 3 seconds
      setTimeout(() => {
        setIsResettingPassword(false);
        setResetSuccess(null);
      }, 3000);
    } catch (err) {
      setResetError(err.response?.data?.message || 'Failed to reset password. Verify email.');
    } finally {
      setIsResettingSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        
        {isResettingPassword ? (
          <>
            <h2 className="text-3xl font-bold text-center mb-8">
              Reset Admin Password
            </h2>

            {resetError && <div className="bg-red-100 text-red-700 p-4 rounded mb-6 text-sm">{resetError}</div>}
            {resetSuccess && <div className="bg-green-100 text-green-700 p-4 rounded mb-6 text-sm">{resetSuccess}</div>}

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-2.5 px-4 text-sm"
                  placeholder="admin@mystore.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-2.5 px-4 text-sm"
                  placeholder="Enter new password (min 6 chars)"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-2.5 px-4 text-sm"
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isResettingSubmitting}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 mt-2"
              >
                {isResettingSubmitting ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>

            <p className="mt-6 text-center text-gray-600">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsResettingPassword(false);
                  setResetError(null);
                }}
                className="text-indigo-600 hover:underline font-medium focus:outline-none"
              >
                Back to Login
              </button>
            </p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-center mb-8">
              {isAdminLogin ? 'Admin Login' : 'User Login'}
            </h2>

            {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6 text-sm">{error}</div>}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email or Mobile
                </label>
                <input
                  {...register('emailOrMobile')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-3 px-4 bg-white"
                  placeholder="Enter email or mobile"
                />
                {errors.emailOrMobile && (
                  <p className="mt-1 text-sm text-red-600">{errors.emailOrMobile.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  {...register('password')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-3 px-4 bg-white"
                  placeholder="Enter password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
                {!isAdminLogin && (
                  <div className="flex justify-end mt-2">
                    <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline font-medium">
                      Forgot Password?
                    </Link>
                  </div>
                )}
                {isAdminLogin && (
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResettingPassword(true);
                        setError(null);
                      }}
                      className="text-sm text-indigo-600 hover:underline font-medium focus:outline-none"
                    >
                      Forgot Password? Reset Here
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Logging in...' : isAdminLogin ? 'Login as Admin' : 'Login'}
              </button>
            </form>

            {isAdminLogin ? (
              <p className="mt-6 text-center text-gray-600">
                Login as a customer?{' '}
                <Link to="/login" className="text-indigo-600 hover:underline">
                  User login
                </Link>
              </p>
            ) : (
              <p className="mt-6 text-center text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-indigo-600 hover:underline">
                  Register here
                </Link>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
