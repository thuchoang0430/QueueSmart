import NotificationsPanel from '../../components/NotificationsPanel'
import { useAuth } from '../../context/AuthContext'

// Dedicated notifications page. Reuses the same NotificationsPanel that the
// dashboard shows, so both stay in sync with GET /api/notifications.
export default function Notifications() {
  const { currentUser } = useAuth()

  if (!currentUser) {
    return (
      <div>
        <div className="page-header">
          <h1>Notifications</h1>
          <p>Please log in to view your notifications.</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">No user is currently logged in.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Notifications</h1>
        <p>Updates about the queues you have joined.</p>
      </div>

      <div className="max-w-2xl">
        <NotificationsPanel />
      </div>
    </div>
  )
}
