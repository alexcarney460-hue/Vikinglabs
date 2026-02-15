const HUBSPOT_API_URL = 'https://api.hubapi.com';
const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;

export type ContactInput = {
  email: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  company?: string;
  website?: string;
  message?: string;
  source?: string; // e.g., 'contact_form', 'affiliate_signup', 'cart_abandonment'
  product_interest?: string;
};

export async function createOrUpdateContact(contact: ContactInput) {
  if (!HUBSPOT_API_KEY) {
    throw new Error('HUBSPOT_API_KEY not configured');
  }

  try {
    const properties = [
      { property: 'email', value: contact.email },
    ];

    if (contact.firstname) properties.push({ property: 'firstname', value: contact.firstname });
    if (contact.lastname) properties.push({ property: 'lastname', value: contact.lastname });
    if (contact.phone) properties.push({ property: 'phone', value: contact.phone });
    if (contact.company) properties.push({ property: 'company', value: contact.company });
    if (contact.website) properties.push({ property: 'website', value: contact.website });
    if (contact.message) properties.push({ property: 'message', value: contact.message });
    if (contact.source) properties.push({ property: 'hs_lead_status', value: contact.source });
    if (contact.product_interest) properties.push({ property: 'product_interest', value: contact.product_interest });

    const response = await fetch(`${HUBSPOT_API_URL}/crm/v3/objects/contacts/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[HubSpot] Error creating contact:', error);
      throw new Error(error.message || 'Failed to create contact in HubSpot');
    }

    const data = await response.json();
    console.log('[HubSpot] Contact created/updated:', data.id);
    return data;
  } catch (error) {
    console.error('[HubSpot] Error:', error);
    throw error;
  }
}

export async function getContact(email: string) {
  if (!HUBSPOT_API_KEY) {
    throw new Error('HUBSPOT_API_KEY not configured');
  }

  try {
    const response = await fetch(
      `${HUBSPOT_API_URL}/crm/v3/objects/contacts/?limit=1&filter=email|equals|${encodeURIComponent(email)}`,
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch contact from HubSpot');
    }

    const data = await response.json();
    return data.results?.[0] || null;
  } catch (error) {
    console.error('[HubSpot] Error fetching contact:', error);
    throw error;
  }
}
