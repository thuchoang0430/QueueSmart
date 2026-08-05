import { ApiError } from '../../errors'
import { prisma } from '../../database/prisma'

// Reads and (in a later step) updates the signed-in user's profile. The profile
// lives in its own table, linked one-to-one to the credential by credentialId,
// so every lookup here is keyed by the authenticated user's id.

/** The profile shape returned to clients. */
export interface Profile {
  fullName: string
  email: string
  contactInfo: string | null
  preferences: string | null
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
