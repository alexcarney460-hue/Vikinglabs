/**
 * NextAuth Credentials Provider
 * Handles email + password authentication
 */

import CredentialsProvider from 'next-auth/providers/credentials';
import { authenticateEmailUser } from './email-service';

export const EmailCredentialsProvider = CredentialsProvider({
  id: 'email',
  name: 'Email',
  credentials: {
    email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
    password: { label: 'Password', type: 'password' },
    code: { label: 'Verification Code (optional)', type: 'text' },
  },
  async authorize(credentials) {
    if (!credentials?.email || !credentials?.password) {
      throw new Error('Missing email or password');
    }

    // Authenticate user
    const { success, user, error } = await authenticateEmailUser(
      credentials.email,
      credentials.password
    );

    if (!success || !user) {
      throw new Error(error || 'Invalid credentials');
    }

    // Return user object for NextAuth session
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    };
  },
});
