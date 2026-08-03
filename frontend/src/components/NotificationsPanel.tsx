import { useEffect, useState } from 'react'
import { apiGet, apiPost, ApiError } from '../api/client'

// Shape returned by GET /api/notifications (backend/src/store/memoryStore.ts).
interface Notification {
  id: number
  type: 'joined' | 'almost-up' | 'served'
  message: string
  createdAt: number
  read: boolean
}

interface NotificationsResponse {
  notifications: Notification[]
  unreadCount: number
}

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    apiGet<NotificationsResponse>('/notifications')
      .then((data) => {
        setNotifications(data.notifications)
        setUnread(data.unreadCount)
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.displayMessage : 'Could not load notifications.')
      )
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function markAllRead() {
    try {
      await apiPost('/notifications/read')
      load()
    } catch {
      // A failed mark-read is not worth interrupting the user over.
    }
  }

  return (
    <div className="border border-slate-200 rounded-2xl shadow-sm px-5 py-5 space-y-5">
      <div className="flex justify-between">
        <div>
          <p className="text-blue-600 font-bold">🔔 UPDATES</p>
          <p className="text-slate-900 font-bold text-3xl">Notifications</p>
        </div>

        <div>
          <p className="bg-blue-50 text-blue-600 font-bold rounded-full px-3 py-1">{unread}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600">Loading notifications...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-slate-600">No notifications yet.</p>
      ) : (
        <>
          <div className="space-y-5">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="bg-blue-50 w-full rounded-2xl text-slate-600 px-2 py-2 border border-slate-200"
              >
                <p>
                  {n.read ? '⚪' : '🔴'} {n.message}
                </p>
              </div>
            ))}
          </div>

          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Mark all as read
            </button>
          )}
        </>
      )}
    </div>
  )
}
