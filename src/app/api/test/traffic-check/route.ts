import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'No Supabase client' });
    }

    // Try each possible column name combo
    const attempts = [
      { id: 'test1', path: '/test', referrer: null, user_agent: 'test', created_at: new Date().toISOString() },
      { id: 'test2', path: '/test', referrer: null, useragent: 'test', created_at: new Date().toISOString() },
      { id: 'test3', path: '/test', referrer: null, userAgent: 'test', created_at: new Date().toISOString() },
      { id: 'test4', path: '/test', referrer: null, user_agent: 'test', createdAt: new Date().toISOString() },
      { id: 'test5', path: '/test', referrer: null, user_agent: 'test', created_at: new Date() },
    ];

    const results = [];

    for (let i = 0; i < attempts.length; i++) {
      const { error } = await supabase.from('page_views').insert(attempts[i]);
      
      if (!error) {
        results.push({ index: i, success: true, payload: attempts[i] });
      } else {
        results.push({ 
          index: i, 
          success: false, 
          error: error.message,
          payload: attempts[i]
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: String(error) });
  }
}
