import { ApiError } from '../../errors'
import { prisma } from '../../database/prisma'
import { validateOrThrow, type Schema } from '../../validation/validators'

// Reads and updates the signed-in user's profile. The profile lives in its own
// table, linked one-to-one to the credential by credentialId, so every lookup
// here is keyed by the authenticated user's id.

/** The profile shape returned to clients. */
export interface Profile {
  fullName: string
  email: string
  contactInfo: string | null
  preferences: string | null
}

// Email and role are intentionally not editable here: email is the account's
// unique identity across two tables, and role must never be self-assigned.
export const updateProfileSchema: Schema = {
  fullName: { required: true, type: 'string', minLength: 2, maxLength: 50, label: 'Full name' },
  contactInfo: { type: 'string', maxLength: 100, label: 'Contact info' },
  preferences: { type: 'string', maxLength: 500, label: 'Preferences' },
}

// Optional text fields collapse an omitted or blank value to null so the column
// is cleared rather than storing an empty string.
function optionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export async function getProfile(userId: number): Promise<Profile> {
  const profile = await prisma.userProfile.findUnique({ where: { credentialId: userId } })
  if (!profile) {
    throw ApiError.notFound('Profile not found.')
  }

  return {
    fullName: profile.fullName,
    email: profile.email,
    contactInfo: profile.contactInfo,
    preferences: profile.preferences,
  }
}

export async function updateProfile(userId: number, input: unknown): Promise<Profile> {
  validateOrThrow(input, updateProfileSchema)
  const data = (input ?? {}) as { fullName: string; contactInfo?: unknown; preferences?: unknown }

  // Check existence first so a missing profile returns a clean 404 instead of a
  // Prisma "record to update not found" error.
  const existing = await prisma.userProfile.findUnique({ where: { credentialId: userId } })
  if (!existing) {
    throw ApiError.notFound('Profile not found.')
  }

  const updated = await prisma.userProfile.update({
    where: { credentialId: userId },
    data: {
      fullName: data.fullName.trim(),
      contactInfo: optionalText(data.contactInfo),
      preferences: optionalText(data.preferences),
    },
  })

  return {
    fullName: updated.fullName,
    email: updated.email,
    contactInfo: updated.contactInfo,
    preferences: updated.preferences,
  }
}
