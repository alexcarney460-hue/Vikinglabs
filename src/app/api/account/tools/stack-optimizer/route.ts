import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

export const runtime = 'nodejs';

interface StackOptimizerState {
  compounds: Array<{
    id: string;
    name: string;
    frequency: string;
    timeOfDay: string;
    durationDays: number;
    customDays?: number[];
    handlingRequirements: string[];
  }>;
  startDate: string;
}

/**
 * GET /api/account/tools/stack-optimizer
 * Retrieve saved Stack Optimizer state for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a production app, fetch from database
    // For now, just return empty to indicate no saved state
    return NextResponse.json({
      state: null,
      message: 'No saved state. Using browser localStorage.',
    });
  } catch (error) {
    console.error('Stack Optimizer GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/account/tools/stack-optimizer
 * Save Stack Optimizer state for the current user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as StackOptimizerState;

    // Validate
    if (!Array.isArray(body.compounds) || !body.startDate) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // In a production app, save to database
    // For now, just acknowledge the save
    const savedState = {
      compounds: body.compounds,
      startDate: body.startDate,
      savedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'State saved successfully.',
      state: savedState,
    });
  } catch (error) {
    console.error('Stack Optimizer POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
