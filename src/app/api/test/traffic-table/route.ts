import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getSql } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Check Supabase connection
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'No Supabase client' });
    }

    console.log('[Test] Checking page_views table...');

    // Try to fetch one row
    const { data, error, count } = await supabase
      .from('page_views')
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) {
      console.error('[Test] Supabase query error:', error);
      return NextResponse.json({ ok: false, error: error.message, details: error });
    }

    console.log('[Test] Table exists, count:', count);

    // Query information_schema to get actual columns
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'page_views' })
      .catch(() => ({ data: null, error: true }));

    // Fallback: try to select * and inspect the error message
    const { error: selectError } = await supabase
      .from('page_views')
      .select('*')
      .limit(1);

    console.log('[Test] Schema error:', schemaError);
    console.log('[Test] Select error:', selectError);

    // Try to insert a test record
    const testId = `test-${Date.now()}`;
    const { data: insertData, error: insertError } = await supabase
      .from('page_views')
      .insert({
        id: testId,
        path: '/test/traffic-table',
        referrer: null,
        user_agent: 'test',
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('[Test] Insert error:', insertError);
      return NextResponse.json({
        ok: false,
        error: 'Insert failed',
        insertError: insertError.message,
        tableExists: count !== null,
      });
    }

    console.log('[Test] Insert successful');

    return NextResponse.json({
      ok: true,
      message: 'Table is working',
      tableExists: true,
      rowCount: count,
      testInsertId: testId,
    });
  } catch (error) {
    console.error('[Test] Error:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
