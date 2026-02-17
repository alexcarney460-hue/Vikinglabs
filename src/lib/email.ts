/**
 * Email Service
 * Sends verification codes and password reset emails
 * Uses Supabase built-in email or external SMTP
 */

import nodemailer from 'nodemailer';

// Configure based on environment
const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@vikinglabs.co';
const FROM_NAME = process.env.FROM_NAME || 'Viking Labs';

/**
 * Send verification code email
 */
export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  if (!transporter) {
    console.log(`[DEV] Verification code for ${email}: ${code}`);
    return;
  }

  const html = `
    <h2>Welcome to Viking Labs</h2>
    <p>Your verification code is:</p>
    <h1 style="font-family: monospace; letter-spacing: 2px; color: #d97706;">${code}</h1>
    <p>This code expires in 15 minutes.</p>
    <p>If you didn't request this, you can safely ignore this email.</p>
  `;

  await transporter.sendMail({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: 'Your Viking Labs Verification Code',
    html,
    text: `Your verification code is: ${code}\n\nThis expires in 15 minutes.`,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  if (!transporter) {
    console.log(`[DEV] Password reset URL for ${email}: ${resetUrl}`);
    return;
  }

  const html = `
    <h2>Reset Your Password</h2>
    <p>Click the link below to reset your password:</p>
    <p><a href="${resetUrl}" style="color: #d97706; text-decoration: none; font-weight: bold;">Reset Password</a></p>
    <p>Or copy this link:</p>
    <p><code>${resetUrl}</code></p>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;

  await transporter.sendMail({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: 'Reset Your Viking Labs Password',
    html,
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
  });
}

/**
 * Send welcome email (after first signup)
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  if (!transporter) {
    console.log(`[DEV] Welcome email for ${email}`);
    return;
  }

  const html = `
    <h2>Welcome to Viking Labs, ${name}!</h2>
    <p>Your account has been created successfully.</p>
    <p>You can now:</p>
    <ul>
      <li>Browse our catalog of peptides and compounds</li>
      <li>Create a wishlist and save items</li>
      <li>Track your orders</li>
      <li>Join our affiliate program</li>
    </ul>
    <p>Happy exploring!</p>
  `;

  await transporter.sendMail({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: 'Welcome to Viking Labs!',
    html,
    text: `Welcome to Viking Labs, ${name}! Your account is ready to go.`,
  });
}
