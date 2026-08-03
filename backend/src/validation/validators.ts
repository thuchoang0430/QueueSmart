import { ApiError, type FieldErrors } from '../errors'

// A3 requires validating required fields, field types, and length limits.
// Every module declares a Schema and calls validateOrThrow, so the error shape
// the front end sees is identical no matter which endpoint rejected the input.

export interface FieldSpec {
  required?: boolean
  type?: 'string' | 'number' | 'boolean'
  /** Inclusive character-length bounds. Strings only. */
  minLength?: number
  maxLength?: number
  /** Inclusive value bounds. Numbers only. */
  min?: number
  max?: number
  /** Value must be one of these. Used for enums like priority and role. */
  oneOf?: readonly string[]
  pattern?: RegExp
  /** Name shown in the message. Defaults to the field key. */
  label?: string
  /** Message used when `pattern` fails. */
  patternMessage?: string
}

export type Schema = Record<string, FieldSpec>

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isMissing(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '')
}

function checkField(value: unknown, spec: FieldSpec, label: string): string | null {
  if (isMissing(value)) {
    return spec.required ? `${label} is required.` : null
  }

  if (spec.type === 'string' && typeof value !== 'string') {
    return `${label} must be text.`
  }

  if (spec.type === 'number') {
    // Reject NaN and Infinity too - both are typeof 'number' but never valid input.
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return `${label} must be a number.`
    }
  }

  if (spec.type === 'boolean' && typeof value !== 'boolean') {
    return `${label} must be true or false.`
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (spec.minLength !== undefined && trimmed.length < spec.minLength) {
      return `${label} must be at least ${spec.minLength} characters.`
    }
    if (spec.maxLength !== undefined && trimmed.length > spec.maxLength) {
      return `${label} must be ${spec.maxLength} characters or fewer.`
    }
    if (spec.pattern && !spec.pattern.test(trimmed)) {
      return spec.patternMessage ?? `${label} is not valid.`
    }
  }

  if (typeof value === 'number') {
    if (spec.min !== undefined && value < spec.min) {
      return `${label} must be at least ${spec.min}.`
    }
    if (spec.max !== undefined && value > spec.max) {
      return `${label} must be at most ${spec.max}.`
    }
  }

  if (spec.oneOf && !spec.oneOf.includes(String(value))) {
    return `${label} must be one of: ${spec.oneOf.join(', ')}.`
  }

  return null
}

/** Collects every field error at once so the UI can highlight all bad inputs. */
export function validate(body: unknown, schema: Schema): FieldErrors {
  const errors: FieldErrors = {}
  const input = (body ?? {}) as Record<string, unknown>

  for (const [key, spec] of Object.entries(schema)) {
    const message = checkField(input[key], spec, spec.label ?? key)
    if (message) errors[key] = message
  }

  return errors
}

/** Same as `validate`, but throws a 400 ApiError when anything failed. */
export function validateOrThrow(body: unknown, schema: Schema): void {
  const errors = validate(body, schema)
  if (Object.keys(errors).length > 0) {
    throw ApiError.validation(errors)
  }
}

/**
 * Parses a route param like `:id` into a positive integer.
 * Throws a 400 rather than letting `NaN` reach the store lookups.
 */
export function parseId(raw: string, label = 'id'): number {
  const id = Number(raw)
  if (!Number.isInteger(id) || id < 1) {
    throw ApiError.badRequest(`${label} must be a positive whole number.`)
  }
  return id
}
