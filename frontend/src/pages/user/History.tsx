import { useEffect, useState } from 'react'
import { apiGet, ApiError } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

// Shape returned by GET /api/history (backend/src/store/memoryStore.ts).
interface HistoryRecord {
  id: number
  serviceId: number
  serviceName: string
  joinedAt: number
  endedAt: number
  waitMinutes: number
  outcome: 'served' | 'left'
}

function formatDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// The backend stores a compact outcome; the UI shows a friendlier label.
function outcomeLabel(outcome: HistoryRecord['outcome']): string {
  return outcome === 'served' ? 'Served' : 'Left Queue'
}

function outcomeClass(outcome: HistoryRecord['outcome']): string {
  return outcome === 'served'
    ? 'bg-green-100 text-green-700'
    : 'bg-yellow-100 text-yellow-700'
}

export default function History() {
  const { currentUser } = useAuth()
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiGet<{ history: HistoryRecord[] }>('/history')
      .then((data) => setRecords(data.history))
      .catch((err) =>
        setError(err instanceof ApiError ? err.displayMessage : 'Could not load your history.')
      )
      .finally(() => setLoading(false))
  }, [])

  if (!currentUser) {
    return (
      <div>
        <div className="page-header">
          <h1>History</h1>
          <p>Please log in to view your queue history.</p>
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
        <h1>Queue History</h1>
        <p>Review your past queue activity, service names, dates, and outcomes.</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Past Queues</h2>
          <p className="text-sm text-slate-600">
            History for {currentUser.name} ({currentUser.email})
          </p>
        </div>

        {loading ? (
          <p className="px-6 py-6 text-sm text-slate-600">Loading your history...</p>
        ) : error ? (
          <p className="px-6 py-6 text-sm text-red-600">{error}</p>
        ) : records.length === 0 ? (
          <p className="px-6 py-6 text-sm text-slate-600">
            You have no past queue activity yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Service Name</th>
                  <th className="px-6 py-3">Wait Time</th>
                  <th className="px-6 py-3">Outcome</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 text-slate-700">{formatDate(record.endedAt)}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {record.serviceName}
                    </td>
                    <td className="px-6 py-4 text-slate-700">{record.waitMinutes} minutes</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${outcomeClass(
                          record.outcome
                        )}`}
                      >
                        {outcomeLabel(record.outcome)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
        This history is served by the backend API (GET /api/history).
      </div>
    </div>
  )
}
