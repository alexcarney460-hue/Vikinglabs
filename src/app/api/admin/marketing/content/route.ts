import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

// Helper: Check if user is admin by checking auth metadata
async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseServer();
    
    // Get user from auth.users and check raw_user_meta_data
    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);
    
    if (error || !user) return false;
    
    // Check if role is set in user metadata
    return (user.user_metadata as any)?.role === 'admin';
  } catch (err) {
    return false;
  }
}

// GET /api/admin/marketing/content — Fetch marketing content (admin only)
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    const status = req.nextUrl.searchParams.get('status');
    const id = req.nextUrl.searchParams.get('id');
    const supabase = getSupabaseServer();

    let query = supabase
      .from('marketing_content_queue')
      .select('*')
      .order('created_at', { ascending: false });

    if (id) {
      query = query.eq('id', id);
    } else if (status && ['draft', 'approved', 'posted', 'killed'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch content: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ content: data || [] });
  } catch (err) {
    return NextResponse.json(
      { error: (err instanceof Error ? err.message : 'Unknown error') || 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/marketing/content?id=xxx — Update content status
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const body = await req.json() as { status?: string };
    const { status } = body;

    if (!status || !['draft', 'approved', 'posted', 'killed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('marketing_content_queue')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json(
        { error: `Failed to update content: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data?.[0] });
  } catch (err) {
    return NextResponse.json(
      { error: (err instanceof Error ? err.message : 'Unknown error') || 'Failed to update content' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/marketing/content?id=xxx — Delete content
export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from('marketing_content_queue')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: `Failed to delete content: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err instanceof Error ? err.message : 'Unknown error') || 'Failed to delete content' },
      { status: 500 }
    );
  }
}
