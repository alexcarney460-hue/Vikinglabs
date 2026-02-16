import { Session } from 'next-auth';

/**
 * Check if the session has a valid user email
 */
export function hasUserEmail(session: Session | null): boolean {
  if (!session || !session.user) return false;
  return typeof session.user.email === 'string' && session.user.email.length > 0;
}

/**
 * Get the user email from session, or null if not available
 */
export function getUserEmail(session: Session | null): string | null {
  if (!session || !session.user) return null;
  return typeof session.user.email === 'string' ? session.user.email : null;
}

/**
 * Check if session exists and is valid
 */
export function hasSession(session: Session | null): boolean {
  return session !== null && session !== undefined;
}
