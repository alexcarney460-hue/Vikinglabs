import { NextRequest, NextResponse } from 'next/server';
import { createOrUpdateContact } from '@/lib/hubspot';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const { email, firstname, lastname, phone, company, website, message, source, product_interest } = body;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log('[API] Creating/updating contact:', { email, firstname, lastname, source });

    // Create or update contact in HubSpot
    const result = await createOrUpdateContact({
      email,
      firstname: firstname?.trim(),
      lastname: lastname?.trim(),
      phone: phone?.trim(),
      company: company?.trim(),
      website: website?.trim(),
      message: message?.trim(),
      source: source || 'website',
      product_interest: product_interest?.trim(),
    });

    return NextResponse.json({
      ok: true,
      contactId: result.id,
      message: 'Contact created/updated successfully',
    });
  } catch (error) {
    console.error('[API] Error creating contact:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to create contact',
      },
      { status: 500 }
    );
  }
}
