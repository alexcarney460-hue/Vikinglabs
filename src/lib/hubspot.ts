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

export type HubSpotContactProperties = {
  email: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  company?: string;
  website?: string;
  message?: string;
  source?: string;
  product_interest?: string;
  lifecyclestage?: string;
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

export async function upsertContact(properties: HubSpotContactProperties) {
  if (!HUBSPOT_API_KEY) {
    throw new Error('HUBSPOT_API_KEY not configured');
  }

  if (!properties.email) {
    throw new Error('Email is required for upsert');
  }

  try {
    // Check if contact exists
    const existing = await getContact(properties.email);

    if (existing) {
      // Update existing contact
      const contactId = existing.id;
      const propsArray = [];

      if (properties.firstname) propsArray.push({ property: 'firstname', value: properties.firstname });
      if (properties.lastname) propsArray.push({ property: 'lastname', value: properties.lastname });
      if (properties.phone) propsArray.push({ property: 'phone', value: properties.phone });
      if (properties.company) propsArray.push({ property: 'company', value: properties.company });
      if (properties.website) propsArray.push({ property: 'website', value: properties.website });
      if (properties.message) propsArray.push({ property: 'message', value: properties.message });
      if (properties.source) propsArray.push({ property: 'hs_lead_status', value: properties.source });
      if (properties.product_interest) propsArray.push({ property: 'product_interest', value: properties.product_interest });
      if (properties.lifecyclestage) propsArray.push({ property: 'lifecyclestage', value: properties.lifecyclestage });

      const response = await fetch(`${HUBSPOT_API_URL}/crm/v3/objects/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: propsArray,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[HubSpot] Error updating contact:', error);
        throw new Error(error.message || 'Failed to update contact in HubSpot');
      }

      const data = await response.json();
      console.log('[HubSpot] Contact updated:', data.id);
      return data;
    } else {
      // Create new contact
      const propsArray = [
        { property: 'email', value: properties.email },
      ];

      if (properties.firstname) propsArray.push({ property: 'firstname', value: properties.firstname });
      if (properties.lastname) propsArray.push({ property: 'lastname', value: properties.lastname });
      if (properties.phone) propsArray.push({ property: 'phone', value: properties.phone });
      if (properties.company) propsArray.push({ property: 'company', value: properties.company });
      if (properties.website) propsArray.push({ property: 'website', value: properties.website });
      if (properties.message) propsArray.push({ property: 'message', value: properties.message });
      if (properties.source) propsArray.push({ property: 'hs_lead_status', value: properties.source });
      if (properties.product_interest) propsArray.push({ property: 'product_interest', value: properties.product_interest });
      if (properties.lifecyclestage) propsArray.push({ property: 'lifecyclestage', value: properties.lifecyclestage });

      const response = await fetch(`${HUBSPOT_API_URL}/crm/v3/objects/contacts/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: propsArray,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[HubSpot] Error creating contact:', error);
        throw new Error(error.message || 'Failed to create contact in HubSpot');
      }

      const data = await response.json();
      console.log('[HubSpot] Contact created:', data.id);
      return data;
    }
  } catch (error) {
    console.error('[HubSpot] Upsert error:', error);
    throw error;
  }
}
