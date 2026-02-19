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
    const tokenResponse = await fetch('https://graph.instagram.com/v18.0/oauth/access_token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: process.env.META_APP_ID || '',
        client_secret: process.env.META_APP_SECRET || '',
        grant_type: 'authorization_code',
        redirect_uri: process.env.META_REDIRECT_URI || '',
        code,
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

    // Get account info
    const userResponse = await fetch('https://graph.instagram.com/v18.0/me?fields=id,username', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userResponse.json();

    // Store connection
    const { error: insertError } = await supabase
      .from('social_connections')
      .upsert({
        platform: 'instagram',
        admin_id: user.id,
        access_token_enc: encryptedAccessToken,
        account_id: userData.id,
        account_username: userData.username,
        scope: 'instagram_basic,instagram_graph_user_media',
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
      new URL('/account/admin/social-connections?success=instagram', req.url)
    );
  } catch (error) {
    return NextResponse.redirect(
      new URL(`/account/admin/social-connections?error=callback_error`, req.url)
    );
  }
}
