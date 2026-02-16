import { Session } from 'next-auth';

/**
 * Type guard to ensure session.user.email exists
 * Helps TypeScript understand that after this check, user.email is definitely not undefined
 */
export function hasUserEmail(session: Session | null | undefined): session is Session & { user: { email: string } } {
  return Boolean(session?.user?.email);
}
