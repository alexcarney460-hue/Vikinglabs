import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'No Supabase client' }, { status: 500 });
    }

    const { data: rows, error } = await supabase.from('product_overrides').select('*');
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      count: (rows || []).length,
      data: rows 
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
