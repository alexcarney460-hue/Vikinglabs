import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { instagramHandle, email, niche, followerCount, message } = body;

    // Validate required fields
    if (!instagramHandle || !email || !niche || !followerCount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // TODO: Store in database (e.g., creators_applications table)
    // For now, log submission
    console.log('[Creators] New application:', {
      instagramHandle,
      email,
      niche,
      followerCount,
      message,
      timestamp: new Date().toISOString(),
    });

    // Return success
    return NextResponse.json({
      ok: true,
      message: 'Application received',
    });
  } catch (error) {
    console.error('[Creators] Apply error:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}
