import { NextRequest, NextResponse } from 'next/server';
import { upsertContact, HubSpotContactProperties } from '@/lib/hubspot';

type FormType = 'contact' | 'wholesale' | 'newsletter' | 'affiliate';

type SubmissionPayload = Record<string, string>;

const splitName = (name?: string) => {
  if (!name) return { firstname: undefined, lastname: undefined };
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstname: undefined, lastname: undefined };
  const [firstname, ...rest] = parts;
  return {
    firstname,
    lastname: rest.length ? rest.join(' ') : undefined,
  };
};

const builders: Record<FormType, (payload: SubmissionPayload) => HubSpotContactProperties> = {
  contact: (payload) => {
    const { firstname, lastname } = splitName(payload.name);
    const subject = payload.subject || 'General Inquiry';
    const messageBody = `Subject: ${subject}\n\n${payload.message || ''}`.trim();

    return {
      email: payload.email,
      firstname,
      lastname,
      message: messageBody,
      lifecyclestage: 'lead',
    };
  },
  wholesale: (payload) => {
    const { firstname, lastname } = splitName(payload.contactPerson);
    const compiledMessage = `Wholesale Application\nCompany: ${payload.companyName || 'N/A'}\nWebsite: ${payload.website || 'N/A'}\nMonthly Volume: ${payload.volume || 'N/A'}\nDetails: ${payload.details || 'N/A'}`;

    return {
      email: payload.email,
      firstname,
      lastname,
      company: payload.companyName,
      website: payload.website,
      message: compiledMessage,
      lifecyclestage: 'opportunity',
    };
  },
  newsletter: (payload) => ({
    email: payload.email,
    lifecyclestage: 'subscriber',
    message: 'Newsletter opt-in via vikinglabs.ai',
  }),
  affiliate: (payload) => {
    const { firstname, lastname } = splitName(payload.name);
    return {
      email: payload.email,
      firstname,
      lastname,
      lifecyclestage: 'lead',
      message: `Affiliate Inquiry\nHandle: ${payload.socialHandle || 'N/A'}\nAudience: ${payload.audienceSize || 'N/A'}\nChannels: ${payload.channels || 'N/A'}\nNotes: ${payload.notes || 'N/A'}`,
    };
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { formType, payload } = body as { formType?: FormType; payload?: SubmissionPayload };

    if (!formType || !payload) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const builder = builders[formType];
    if (!builder) {
      return NextResponse.json({ error: 'Unsupported form type' }, { status: 400 });
    }

    const properties = builder(payload);
    if (!properties.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await upsertContact(properties);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[HubSpot] submission failed', error);
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}
