/**
 * Discord CTA Component for Email Templates
 * Shared block for both affiliate welcome and first-purchase emails
 */
export interface DiscordCtaProps {
  inviteUrl: string;
  title?: string;
  description?: string;
}

export function DiscordCta({
  inviteUrl,
  title = 'Join the Viking Labs Discord',
  description = 'Get updates, drops, support, and exclusive community access.',
}: DiscordCtaProps) {
  return `
    <!-- Discord CTA Section -->
    <div style="background: linear-gradient(135deg, #5865f2 0%, #4752c4 100%); border-radius: 12px; padding: 32px 24px; margin: 32px 0; text-align: center;">
      <div style="color: #ffffff;">
        <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.9;">
          Community
        </p>
        <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em;">
          ${title}
        </h3>
        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; opacity: 0.95; color: #ffffff;">
          ${description}
        </p>
        <a href="${inviteUrl}" style="display: inline-block; background: #ffffff; color: #5865f2; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; letter-spacing: 0.02em; transition: all 0.2s ease;">
          Join Discord
        </a>
      </div>
    </div>
  `;
}

/**
 * Export as plain string for easy interpolation
 */
export function discordCtaHtml(props: DiscordCtaProps): string {
  return DiscordCta(props);
}
