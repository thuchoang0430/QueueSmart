import { useEffect, useState, type FormEvent } from 'react'
import { apiGet, apiPut, ApiError } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

// Shape returned by GET /api/profile and PUT /api/profile
// (backend/src/modules/profile/profile.service.ts).
interface Profile {
  fullName: string
  email: string
  contactInfo: string | null
  preferences: string | null
}

export default function Profile() {
  const { currentUser } = useAuth()

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [preferences, setPreferences] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  // Per-field messages the backend returns in { error: { fields } }.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    apiGet<{ profile: Profile }>('/profile')
      .then(({ profile }) => {
        setEmail(profile.email)
        setFullName(profile.fullName)
        setContactInfo(profile.contactInfo ?? '')
        setPreferences(profile.preferences ?? '')
      })
      .catch((err) =>
        setLoadError(err instanceof ApiError ? err.displayMessage : 'Could not load your profile.')
      )
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError('')
    setSuccess('')
    setFieldErrors({})
    setSaving(true)

    try {
      // The backend re-validates and owns the length/type rules - see
      // backend/src/modules/profile/profile.service.ts.
      const { profile } = await apiPut<{ profile: Profile }>('/profile', {
        fullName,
        contactInfo,
        preferences,
      })
      setFullName(profile.fullName)
      setContactInfo(profile.contactInfo ?? '')
      setPreferences(profile.preferences ?? '')
      setSuccess('Your profile has been updated.')
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fields ?? {})
        setFormError(err.displayMessage)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (!currentUser) {
    return (
      <div>
        <div className="page-header">
          <h1>My Profile</h1>
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>My Profile</h1>
        <p>View and update your account details.</p>
      </div>

      <div className="max-w-2xl rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Account Details</h2>
          <p className="text-sm text-slate-600">Your name, contact information, and preferences.</p>
        </div>

        {loading ? (
          <p className="px-6 py-6 text-sm text-slate-600">Loading your profile...</p>
        ) : loadError ? (
          <p className="px-6 py-6 text-sm text-red-600">{loadError}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-800">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              />
              <p className="mt-1 text-xs text-slate-400">Email cannot be changed.</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-800">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              {fieldErrors.fullName && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-800">
                Contact Info <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="Phone number or other contact detail"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              {fieldErrors.contactInfo && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.contactInfo}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-800">
                Preferences <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="e.g. notify me by email, preferred services..."
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              {fieldErrors.preferences && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.preferences}</p>
              )}
            </div>

            {formError && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {formError}
              </p>
            )}
            {success && (
              <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 max-w-2xl rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
        This profile is served and saved by the backend API (GET / PUT /api/profile).
      </div>
    </div>
  )
}
