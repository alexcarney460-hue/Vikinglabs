/**
 * Email Authentication Service
 * Handles verification codes, password resets, and email user management
 */

import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a random reset token
 */
export function generateResetToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}

/**
 * Send verification code to email
 * Creates new verification token, expires in 15 minutes
 */
export async function sendVerificationCode(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Clean up old codes for this email
    await supabase
      .from('email_verification_tokens')
      .delete()
      .eq('email', email)
      .is('used_at', null);

    // Generate new code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save to database
    const { error: dbError } = await supabase
      .from('email_verification_tokens')
      .insert([
        {
          email,
          code,
          expires_at: expiresAt.toISOString(),
        },
      ]);

    if (dbError) throw dbError;

    // Send email
    await sendVerificationEmail(email, code);

    return { success: true };
  } catch (error) {
    console.error('Failed to send verification code:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send verification code',
    };
  }
}

/**
 * Verify code and create/update user account
 */
export async function verifyEmailCode(
  email: string,
  code: string,
  displayName?: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Find valid code
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .is('used_at', null)
      .single();

    if (tokenError || !tokenData) {
      return { success: false, error: 'Invalid or expired code' };
    }

    // Check expiry
    if (new Date(tokenData.expires_at) < new Date()) {
      return { success: false, error: 'Code has expired' };
    }

    // Check if user exists
    let { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    let userId: string;

    if (!existingUser) {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          {
            email,
            name: displayName || email.split('@')[0],
            email_verified_at: new Date().toISOString(),
            auth_method: 'email',
          },
        ])
        .select('id')
        .single();

      if (createError) throw createError;
      userId = newUser.id;
    } else {
      userId = existingUser.id;
    }

    // Mark token as used
    await supabase
      .from('email_verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    return { success: true, userId };
  } catch (error) {
    console.error('Failed to verify email code:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify code',
    };
  }
}

/**
 * Hash password for storage
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create user with email and password
 */
export async function createEmailUser(
  email: string,
  password: string,
  displayName?: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return { success: false, error: 'Email already registered' };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          email,
          name: displayName || email.split('@')[0],
          password_hash: passwordHash,
          email_verified_at: new Date().toISOString(),
          auth_method: 'email',
        },
      ])
      .select('id')
      .single();

    if (createError) throw createError;

    return { success: true, userId: newUser.id };
  } catch (error) {
    console.error('Failed to create email user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create account',
    };
  }
}

/**
 * Authenticate user with email and password
 */
export async function authenticateEmailUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    // Find user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user || !user.password_hash) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return { success: false, error: 'Invalid email or password' };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Failed to authenticate user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      // Don't reveal if email exists (security)
      return { success: true };
    }

    // Generate reset token
    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Save token
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert([
        {
          user_id: user.id,
          token,
          expires_at: expiresAt.toISOString(),
        },
      ]);

    if (tokenError) throw tokenError;

    // Send email
    const resetUrl = `${process.env.NEXTAUTH_URL}/account/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetUrl);

    return { success: true };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send reset email',
    };
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find valid token
    const { data: resetToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .single();

    if (tokenError || !resetToken) {
      return { success: false, error: 'Invalid or expired reset link' };
    }

    // Check expiry
    if (new Date(resetToken.expires_at) < new Date()) {
      return { success: false, error: 'Reset link has expired' };
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', resetToken.user_id);

    if (updateError) throw updateError;

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetToken.id);

    return { success: true };
  } catch (error) {
    console.error('Failed to reset password:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset password',
    };
  }
}
