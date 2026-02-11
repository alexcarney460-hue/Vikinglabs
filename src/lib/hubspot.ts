const HUBSPOT_API_BASE = 'https://api.hubapi.com';

const token = process.env.HUBSPOT_PRIVATE_TOKEN;

if (!token) {
  console.warn('[HubSpot] HUBSPOT_PRIVATE_TOKEN is not set. Submissions will fail.');
}

async function hubspotFetch<T>(path: string, init: RequestInit): Promise<T> {
  if (!token) {
    throw new Error('Missing HUBSPOT_PRIVATE_TOKEN');
  }

  const res = await fetch(`${HUBSPOT_API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HubSpot request failed (${res.status}): ${text}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

async function findContactByEmail(email: string): Promise<string | null> {
  try {
    const data = await hubspotFetch<{ results: Array<{ id: string }> }>(
      '/crm/v3/objects/contacts/search',
      {
        method: 'POST',
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: email,
                },
              ],
            },
          ],
          limit: 1,
        }),
      }
    );

    if (data.results && data.results.length > 0) {
      return data.results[0].id;
    }
    return null;
  } catch (err) {
    console.error('[HubSpot] contact lookup failed', err);
    return null;
  }
}

export type HubSpotContactProperties = Record<string, string | undefined>;

export async function upsertContact(properties: HubSpotContactProperties) {
  const email = properties.email;
  if (!email) {
    throw new Error('Email is required to upsert a HubSpot contact');
  }

  const contactId = await findContactByEmail(email);

  if (contactId) {
    await hubspotFetch(`/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties }),
    });
    return contactId;
  }

  const created = await hubspotFetch<{ id: string }>(
    '/crm/v3/objects/contacts',
    {
      method: 'POST',
      body: JSON.stringify({ properties }),
    }
  );

  return created.id;
}
