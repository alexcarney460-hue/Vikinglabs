type DiscordInviteInput = {
  discordUserId: string;
  affiliateName: string;
  affiliateCode?: string;
};

const API_BASE = 'https://discord.com/api/v10';

async function discordRequest(path: string, options: RequestInit) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    throw new Error('DISCORD_BOT_TOKEN not configured');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Discord API error ${response.status}: ${payload}`);
  }

  return response.json().catch(() => ({}));
}

async function createInviteLink() {
  const channelId = process.env.DISCORD_INVITE_CHANNEL_ID;
  if (!channelId) {
    throw new Error('DISCORD_INVITE_CHANNEL_ID not configured');
  }

  const invite = await discordRequest(`/channels/${channelId}/invites`, {
    method: 'POST',
    body: JSON.stringify({
      max_age: 60 * 60 * 24 * 7,
      max_uses: 1,
      temporary: false,
      unique: true,
    }),
  });

  return `https://discord.gg/${invite.code}`;
}

async function sendDirectMessage(discordUserId: string, content: string) {
  const channel = await discordRequest('/users/@me/channels', {
    method: 'POST',
    body: JSON.stringify({ recipient_id: discordUserId }),
  });

  if (!channel?.id) {
    throw new Error('Unable to create DM channel');
  }

  await discordRequest(`/channels/${channel.id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

async function assignAffiliateRole(discordUserId: string) {
  const guildId = process.env.DISCORD_GUILD_ID;
  const roleId = process.env.DISCORD_AFFILIATE_ROLE_ID;
  if (!guildId || !roleId) return;

  await discordRequest(`/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`, {
    method: 'PUT',
  });
}

export async function sendDiscordAffiliateInvite(input: DiscordInviteInput) {
  if (!process.env.DISCORD_BOT_TOKEN) {
    console.warn('Discord invite skipped: DISCORD_BOT_TOKEN not configured.');
    return;
  }

  const inviteUrl = await createInviteLink();
  const message = `Hey ${input.affiliateName}! You're approved for the Viking Labs affiliate program.\n\nJoin the Discord: ${inviteUrl}\nAffiliate code: ${input.affiliateCode || 'TBD'}`;

  await sendDirectMessage(input.discordUserId, message);

  try {
    await assignAffiliateRole(input.discordUserId);
  } catch (error) {
    console.warn('Discord role assignment failed (user may not be in guild yet).');
  }
}
