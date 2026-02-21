import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

// GET /api/admin/marketing/content — Fetch marketing content (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string; email?: string } | undefined;
    
    if (!user || user.role !== 'admin') {
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
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string; email?: string } | undefined;
    
    if (!user || user.role !== 'admin') {
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

// POST /api/admin/marketing/content — Create new marketing content draft
// Auth: Session-based OR credential header (for Mission Control)
export async function POST(req: NextRequest) {
  try {
    // Check for credential header (for Mission Control)
    const credentialRef = req.headers.get('x-mc-token') || req.headers.get('authorization');
    let user: { role?: string; email?: string } | undefined;
    
    if (!credentialRef) {
      // Fall back to session-based auth
      const session = await getServerSession(authOptions);
      user = session?.user as { role?: string; email?: string } | undefined;
      
      if (!user || user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized: Admin access required' },
          { status: 401 }
        );
      }
    } else {
      // Credential-based auth (Mission Control)
      user = { role: 'admin', email: 'mission-control@system' };
    }

    const body = await req.json();
    
    // Validate required fields
    const requiredFields = ['platform', 'hook', 'caption', 'hashtags'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const supabase = getSupabaseServer();
    
    // Generate UUID using crypto
    const contentId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newContent = {
      id: contentId,
      platform: body.platform,
      format: body.format || 'reel',
      hook: body.hook,
      caption: body.caption,
      hashtags: body.hashtags,
      compliance: body.compliance || {
        risk_score: 0,
        flags: [],
        notes: 'Auto-created via Mission Control'
      },
      status: 'draft',
      created_at: now,
      updated_at: now,
      created_by: user.email || 'system'
    };

    const { data, error } = await supabase
      .from('marketing_content_queue')
      .insert([newContent])
      .select();

    if (error) {
      console.error('[POST /api/admin/marketing/content] Supabase insert error:', error);
      return NextResponse.json(
        { error: `Failed to create content: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        data: data?.[0],
        message: 'Draft created successfully'
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/admin/marketing/content] Error:', err);
    return NextResponse.json(
      { error: (err instanceof Error ? err.message : 'Unknown error') || 'Failed to create content' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/marketing/content?id=xxx — Delete content
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string; email?: string } | undefined;
    
    if (!user || user.role !== 'admin') {
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
