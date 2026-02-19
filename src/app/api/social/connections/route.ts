import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { encryptToken } from '@/lib/tokenEncryption';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { platform, account_id, account_username, access_token, refresh_token } = body;

    if (!platform || !account_id || !access_token) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, account_id, access_token' },
        { status: 400 }
      );
    }

    const encryptedAccessToken = encryptToken(access_token);
    const encryptedRefreshToken = refresh_token ? encryptToken(refresh_token) : null;

    const { data, error } = await supabase
      .from('social_connections')
      .upsert(
        {
          platform,
          admin_id: user.id,
          access_token_enc: encryptedAccessToken,
          refresh_token_enc: encryptedRefreshToken,
          account_id,
          account_username,
          status: 'active',
        },
        { onConflict: 'platform,account_id' }
      )
      .select('id, platform, account_username, status')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      platform: data.platform,
      account_username: data.account_username,
      status: 'connected',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('social_connections')
      .select('id, platform, account_username, status, created_at')
      .eq('admin_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ connections: data || [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();

    const { error } = await supabase
      .from('social_connections')
      .delete()
      .eq('id', id)
      .eq('admin_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: 'disconnected' });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
