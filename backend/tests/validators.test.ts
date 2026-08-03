import { describe, expect, it } from 'vitest'
import { ApiError } from '../src/errors'
import {
  EMAIL_PATTERN,
  parseId,
  validate,
  validateOrThrow,
  type Schema,
} from '../src/validation/validators'

const schema: Schema = {
  name: { required: true, type: 'string', minLength: 2, maxLength: 10, label: 'Name' },
  age: { required: true, type: 'number', min: 1, max: 120, label: 'Age' },
  role: { required: false, type: 'string', oneOf: ['user', 'admin'], label: 'Role' },
  email: {
    required: false,
    type: 'string',
    pattern: EMAIL_PATTERN,
    patternMessage: 'Email must be a valid address.',
  },
}

describe('validate - required fields', () => {
  it('accepts input that satisfies every rule', () => {
    expect(validate({ name: 'Ada', age: 30, role: 'admin' }, schema)).toEqual({})
  })

  it('flags missing required fields', () => {
    const errors = validate({}, schema)
    expect(errors.name).toBe('Name is required.')
    expect(errors.age).toBe('Age is required.')
  })

  it('treats a whitespace-only string as missing', () => {
    expect(validate({ name: '   ', age: 30 }, schema).name).toBe('Name is required.')
  })

  it('ignores optional fields that are absent', () => {
    expect(validate({ name: 'Ada', age: 30 }, schema)).toEqual({})
  })

  it('reports every failing field at once rather than stopping at the first', () => {
    const errors = validate({ name: 'A', age: 500, role: 'ghost' }, schema)
    expect(Object.keys(errors).sort()).toEqual(['age', 'name', 'role'])
  })
})

describe('validate - field types', () => {
  it('rejects a number where text is expected', () => {
    expect(validate({ name: 42, age: 30 }, schema).name).toBe('Name must be text.')
  })

  it('rejects a numeric string where a number is expected', () => {
    expect(validate({ name: 'Ada', age: '30' }, schema).age).toBe('Age must be a number.')
  })

  it('rejects NaN, which is technically typeof number', () => {
    expect(validate({ name: 'Ada', age: Number.NaN }, schema).age).toBe('Age must be a number.')
  })

  it('rejects Infinity', () => {
    expect(validate({ name: 'Ada', age: Number.POSITIVE_INFINITY }, schema).age).toBe(
      'Age must be a number.'
    )
  })

  it('checks boolean fields', () => {
    const boolSchema: Schema = { active: { required: true, type: 'boolean', label: 'Active' } }
    expect(validate({ active: 'yes' }, boolSchema).active).toBe('Active must be true or false.')
    expect(validate({ active: false }, boolSchema)).toEqual({})
  })
})

describe('validate - length and range limits', () => {
  it('rejects strings under the minimum length', () => {
    expect(validate({ name: 'A', age: 30 }, schema).name).toBe(
      'Name must be at least 2 characters.'
    )
  })

  it('rejects strings over the maximum length', () => {
    expect(validate({ name: 'x'.repeat(11), age: 30 }, schema).name).toBe(
      'Name must be 10 characters or fewer.'
    )
  })

  it('measures length after trimming', () => {
    expect(validate({ name: '  Ada  ', age: 30 }, schema)).toEqual({})
  })

  it('accepts values exactly on the boundary', () => {
    expect(validate({ name: 'ab', age: 1 }, schema)).toEqual({})
    expect(validate({ name: 'x'.repeat(10), age: 120 }, schema)).toEqual({})
  })

  it('rejects numbers outside the allowed range', () => {
    expect(validate({ name: 'Ada', age: 0 }, schema).age).toBe('Age must be at least 1.')
    expect(validate({ name: 'Ada', age: 121 }, schema).age).toBe('Age must be at most 120.')
  })
})

describe('validate - enums and patterns', () => {
  it('rejects a value outside the allowed set', () => {
    expect(validate({ name: 'Ada', age: 30, role: 'ghost' }, schema).role).toBe(
      'Role must be one of: user, admin.'
    )
  })

  it('rejects a malformed email using the custom message', () => {
    expect(validate({ name: 'Ada', age: 30, email: 'not-an-email' }, schema).email).toBe(
      'Email must be a valid address.'
    )
  })

  it('accepts a well formed email', () => {
    expect(validate({ name: 'Ada', age: 30, email: 'ada@test.edu' }, schema)).toEqual({})
  })
})

describe('validateOrThrow', () => {
  it('does nothing when input is valid', () => {
    expect(() => validateOrThrow({ name: 'Ada', age: 30 }, schema)).not.toThrow()
  })

  it('throws a 400 ApiError carrying the field errors', () => {
    try {
      validateOrThrow({ age: 30 }, schema)
      expect.unreachable('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      const apiError = err as ApiError
      expect(apiError.status).toBe(400)
      expect(apiError.code).toBe('VALIDATION_ERROR')
      expect(apiError.fields?.name).toBe('Name is required.')
    }
  })

  it('handles a null body without crashing', () => {
    expect(() => validateOrThrow(null, schema)).toThrow(ApiError)
  })
})

describe('parseId', () => {
  it('parses a positive integer', () => {
    expect(parseId('7')).toBe(7)
  })

  it.each(['0', '-3', 'abc', '1.5', ''])('rejects %o', (raw) => {
    expect(() => parseId(raw)).toThrow(ApiError)
  })
})
