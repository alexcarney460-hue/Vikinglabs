import { NextResponse } from 'next/server';
import { products } from '../../catalog/data';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
    }

    // Construct a context summary of products
    const productContext = products.map(p => 
      `- ${p.name} ($${p.price}): ${p.desc} (Focus: ${p.research})`
    ).join('\n');

    const systemPrompt = `
      You are the Viking Labs AI Support Agent.
      Your goal is to assist researchers in finding high-purity peptides for laboratory use.
      
      CORE RULES:
      1. STRICTLY emphasize that all products are for LABORATORY RESEARCH USE ONLY. Not for human consumption.
      2. If a user asks about personal use, dosage, or medical advice, refuse politely and state that you can only discuss research applications.
      3. Be helpful, professional, and concise.
      
      STORE POLICIES:
      - Free Shipping on orders over $200.
      - All batches are HPLC tested (>99% purity).
      - Manufactured in a sterile Class 100 facility.
      - We offer wholesale/white label options.
      
      PRODUCT CATALOG:
      ${productContext}
    `;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // or gpt-3.5-turbo if preferred
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
      }),
    });

    const data = await res.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
