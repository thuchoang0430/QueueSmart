import { useState } from 'react'
import { useServices } from '../../context/ServicesContext'
import ServiceForm from './components/ServiceForm'
import type { NewServiceInput, Priority, Service } from '../../types'

const priorityBadge: Record<Priority, string> = {
  low: 'badge-gray',
  medium: 'badge-warning',
  high: 'badge-danger',
}

type Mode = 'create' | { id: number } | null

export default function ServiceManagement() {
  const {
    services,
    servicesLoading,
    servicesError,
    clearServicesError,
    addService,
    updateService,
    removeService,
  } = useServices()
  const [mode, setMode] = useState<Mode>(null)
  const [confirmDelete, setConfirmDelete] = useState<Service | null>(null)

  const editingService =
    mode && mode !== 'create' ? services.find((s) => s.id === mode.id) : null

  async function handleSubmit(
    values: NewServiceInput,
  ) {
    try {
      clearServicesError()

      if (mode === 'create') {
        await addService(values)
      } else if (editingService) {
        await updateService(
          editingService.id,
          values,
        )
      }

      setMode(null)
    } catch {
      // The context exposes the backend error.
    }
  }

  async function handleDeleteConfirmed() {
    if (!confirmDelete) return

    try {
      clearServicesError()
      await removeService(confirmDelete.id)
      setConfirmDelete(null)
    } catch {
      // The context exposes the backend error.
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Service Management</h1>
        <p>Create and edit the services available to users.</p>
      </div>

      {servicesError && (
        <div
          className="card"
          style={{
            marginBottom: 16,
            borderColor: 'var(--danger)',
          }}
        >
          {servicesError}
        </div>
      )}

      {servicesLoading ? (
        <div className="card">
          <p className="empty">
            Loading services...
          </p>
        </div>
      ) : mode ? (
        <div className="card" style={{ maxWidth: 520 }}>
          <h2>{mode === 'create' ? 'Create Service' : `Edit ${editingService?.name}`}</h2>
          <ServiceForm
            initialValues={editingService ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => setMode(null)}
          />
        </div>
      ) : (
        <>
          <div className="btn-row" style={{ marginBottom: 16 }}>
            <button type="button" className="btn btn-primary" onClick={() => setMode('create')}>
              + Add New Service
            </button>
          </div>

          <div className="card">
            <h2>Existing Services</h2>
            {services.length === 0 ? (
              <p className="empty">No services yet. Click "Add New Service" to create one.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Duration</th>
                    <th>Priority</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.description}</td>
                      <td>{s.duration} min</td>
                      <td>
                        <span className={`badge ${priorityBadge[s.priority]}`}>{s.priority}</span>
                      </td>
                      <td>
                        <div className="btn-row">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setMode({ id: s.id })}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => setConfirmDelete(s)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {confirmDelete && (
        <div className="modal-backdrop show" onClick={(e) => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div className="modal">
            <h2>Delete service?</h2>
            <p className="subtitle">
              "{confirmDelete.name}" will be permanently removed, along with its queue. This can't be undone.
            </p>
            <div className="btn-row" style={{ justifyContent: 'flex-end', marginTop: 24 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteConfirmed}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
