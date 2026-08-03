import { Navigate, Outlet } from 'react-router-dom'
import Topbar from '../components/Topbar'
import { useAuth } from '../context/AuthContext'

const ADMIN_LINKS = [
  { to: '/admin', label: 'Admin Dashboard', end: true },
  { to: '/admin/services', label: 'Service Management' },
  { to: '/admin/queue-management', label: 'Queue Management' },
]

export default function AdminLayout() {
  const { currentUser, loading, logout } = useAuth()

  // See UserLayout - wait for the stored token to be verified before deciding
  // whether to redirect.
  if (loading) return <p className="p-6 text-sm text-slate-500">Loading...</p>

  if (!currentUser) return <Navigate to="/" replace />
  if (currentUser.role !== 'admin') return <Navigate to="/dashboard" replace />

  return (
    <>
      <Topbar brand="QueueSmart · Admin" links={ADMIN_LINKS} email={currentUser.email} onLogout={logout} />
      <Outlet />
    </>
  )
}
