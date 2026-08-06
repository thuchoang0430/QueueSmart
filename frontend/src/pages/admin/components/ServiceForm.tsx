import { useState, type FormEvent } from 'react'
import { PRIORITY_LEVELS } from '../../../types'
import type {
  NewServiceInput,
  Priority,
  Service,
} from '../../../types'

interface FormValues {
  name: string
  description: string
  duration: string
  priority: Priority | ''
}

type FormErrors = Partial<Record<keyof FormValues, string>>

const emptyForm: FormValues = { name: '', description: '', duration: '', priority: '' }

function toFormValues(service?: Service): FormValues {
  if (!service) return emptyForm
  return {
    name: service.name,
    description: service.description,
    duration: String(service.duration),
    priority: service.priority,
  }
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}

  if (!values.name.trim()) {
    errors.name = 'Service name is required.'
  } else if (values.name.length > 100) {
    errors.name = 'Service name must be 100 characters or fewer.'
  }

  if (!values.description.trim()) {
    errors.description = 'Description is required.'
  }

  const duration = Number(values.duration)
  if (values.duration === '' || Number.isNaN(duration)) {
    errors.duration = 'Expected duration is required.'
  } else if (!Number.isInteger(duration) || duration <= 0 || duration > 240) {
    errors.duration = 'Duration must be a whole number between 1 and 240 minutes.'
  }

  if (!values.priority) {
    errors.priority = 'Priority level is required.'
  }

  return errors
}

interface ServiceFormProps {
  initialValues?: Service
  onSubmit: (values: NewServiceInput) => void
  onCancel: () => void
}

export default function ServiceForm({ initialValues, onSubmit, onCancel }: ServiceFormProps) {
  const [values, setValues] = useState<FormValues>(toFormValues(initialValues))
  const [errors, setErrors] = useState<FormErrors>({})

  function handleChange<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0 && values.priority) {
      onSubmit({
        name: values.name.trim(),
        description: values.description.trim(),
        duration: Number(values.duration),
        priority: values.priority,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="name">
          Service Name <span className="required">*</span>
        </label>
        <input
          id="name"
          type="text"
          maxLength={100}
          className={errors.name ? 'error' : ''}
          value={values.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />
        <div className="hint">{values.name.length}/100 characters</div>
        <div className={`error-msg ${errors.name ? 'show' : ''}`}>{errors.name}</div>
      </div>

      <div className="form-group">
        <label htmlFor="description">
          Description <span className="required">*</span>
        </label>
        <textarea
          id="description"
          rows={3}
          className={errors.description ? 'error' : ''}
          value={values.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />
        <div className={`error-msg ${errors.description ? 'show' : ''}`}>{errors.description}</div>
      </div>

      <div className="form-group">
        <label htmlFor="duration">
          Expected Duration (minutes) <span className="required">*</span>
        </label>
        <input
          id="duration"
          type="number"
          min={1}
          max={240}
          className={errors.duration ? 'error' : ''}
          value={values.duration}
          onChange={(e) => handleChange('duration', e.target.value)}
        />
        <div className={`error-msg ${errors.duration ? 'show' : ''}`}>{errors.duration}</div>
      </div>

      <div className="form-group">
        <label htmlFor="priority">
          Priority Level <span className="required">*</span>
        </label>
        <select
          id="priority"
          className={errors.priority ? 'error' : ''}
          value={values.priority}
          onChange={(e) => handleChange('priority', e.target.value as Priority)}
        >
          <option value="">Select a priority...</option>
          {PRIORITY_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </option>
          ))}
        </select>
        <div className={`error-msg ${errors.priority ? 'show' : ''}`}>{errors.priority}</div>
      </div>

      <div className="btn-row">
        <button type="submit" className="btn btn-primary">
          {initialValues ? 'Save Changes' : 'Create Service'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
