import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({
  adminOnly = false,
  restrictAdmin = false,
  children,
}) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to={adminOnly ? '/admin' : '/login'} replace />;
  }

  const isAdmin = user?.company === 'ADMIN';

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (restrictAdmin && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children ? children : <Outlet />;
}
