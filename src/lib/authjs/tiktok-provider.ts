// TikTok OAuth provider (Auth.js v4 custom provider)
// Requires you to set TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET.
// NOTE: TikTok OAuth endpoints and scopes can vary by app type.

import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers/oauth';

type TikTokProfile = {
  open_id: string;
  union_id?: string;
  avatar_url?: string;
  display_name?: string;
};

export default function TikTokProvider(
  options: OAuthUserConfig<TikTokProfile>
): OAuthConfig<TikTokProfile> {
  return {
    id: 'tiktok',
    name: 'TikTok',
    type: 'oauth',
    authorization: {
      url: 'https://www.tiktok.com/v2/auth/authorize/',
      params: {
        scope: 'user.info.basic',
        response_type: 'code',
      },
    },
    token: 'https://open.tiktokapis.com/v2/oauth/token/',
    userinfo: {
      url: 'https://open.tiktokapis.com/v2/user/info/',
      async request({ tokens }) {
        const res = await fetch('https://open.tiktokapis.com/v2/user/info/', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const data = await res.json();
        // TikTok wraps data in { data: { user: ... } } in some responses
        return data?.data?.user ?? data;
      },
    },
    profile(profile) {
      return {
        id: profile.open_id,
        name: profile.display_name || null,
        email: null, // TikTok usually does not provide email
        image: profile.avatar_url || null,
      };
    },
    clientId: options.clientId,
    clientSecret: options.clientSecret,
  };
}
