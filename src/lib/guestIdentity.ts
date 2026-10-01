/**
 * Single source of truth for the local guest profile.
 *
 * The guest athlete only exists in the device-local mirror: it must never be
 * written to a Firestore `users/{uid}` document, because that document belongs
 * to whoever is actually authenticated. `api.updateRootSettings` enforces that
 * by comparing the profile email against `auth.currentUser?.email`.
 */
export const GUEST_EMAIL = 'guest@forma.app';