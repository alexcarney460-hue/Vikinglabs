import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { encryptToken } from '@/lib/tokenEncryption';

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code');
    const state = req.nextUrl.searchParams.get('state');
    const error = req.nextUrl.searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/account/admin/social-connections?error=${error}`, req.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/account/admin/social-connections?error=no_code', req.url)
      );
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v1/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TIKTOK_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.redirect(
        new URL('/account/admin/social-connections?error=token_exchange_failed', req.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        new URL('/account/admin/social-connections?error=not_authenticated', req.url)
      );
    }

    // Encrypt tokens
    const encryptedAccessToken = encryptToken(tokenData.access_token);
    const encryptedRefreshToken = tokenData.refresh_token
      ? encryptToken(tokenData.refresh_token)
      : null;

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 86400));

    // Get account info
    const userResponse = await fetch('https://open.tiktokapis.com/v1/user/info/?fields=open_id,display_name', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userResponse.json();

    // Store connection
    const { error: insertError } = await supabase
      .from('social_connections')
      .upsert({
        platform: 'tiktok',
        admin_id: user.id,
        access_token_enc: encryptedAccessToken,
        refresh_token_enc: encryptedRefreshToken,
        expires_at: expiresAt.toISOString(),
        account_id: userData.data?.open_id,
        account_username: userData.data?.display_name,
        scope: 'video.upload,user.info.basic',
        status: 'active',
      }, {
        onConflict: 'platform,account_id'
      });

    if (insertError) {
      return NextResponse.redirect(
        new URL('/account/admin/social-connections?error=storage_failed', req.url)
      );
    }

    return NextResponse.redirect(
      new URL('/account/admin/social-connections?success=tiktok', req.url)
    );
  } catch (error) {
    return NextResponse.redirect(
      new URL(`/account/admin/social-connections?error=callback_error`, req.url)
    );
  }
}
