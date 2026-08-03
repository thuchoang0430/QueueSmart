import { Navigate, Outlet } from 'react-router-dom'
import Topbar from '../components/Topbar'
import { useAuth } from '../context/AuthContext'

const USER_LINKS = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/join-queue', label: 'Join Queue' },
  { to: '/queue-status', label: 'Queue Status' },
  { to: '/history', label: 'History' },
  { to: '/notifications', label: 'Notifications' },
]

export default function UserLayout() {
  const { currentUser, loading, logout } = useAuth()

  // On a page refresh the stored token has to be checked against the backend
  // first. Without this the guard below would redirect to login before the
  // check finishes and log the user out on every reload.
  if (loading) return <p className="p-6 text-sm text-slate-500">Loading...</p>

  if (!currentUser) return <Navigate to="/" replace />
  if (currentUser.role !== 'user') return <Navigate to="/admin" replace />

  return (
    <>
      <Topbar brand="QueueSmart" links={USER_LINKS} email={currentUser.email} onLogout={logout} />
      <Outlet />
    </>
  )
}
