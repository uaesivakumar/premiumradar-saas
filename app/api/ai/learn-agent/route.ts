import { NextRequest, NextResponse } from 'next/server';

// System prompt for the Learn Agent
const SYSTEM_PROMPT = `You are the AI Learning Agent for SIVA OS Founder Bible. Your role is to help the founder (Sivakumar) understand every aspect of SIVA OS - the AI Sales Operating System.

## Your Knowledge Domain:
- SIVA OS architecture (Kernel, Tools, Evidence Engine, SCE)
- The 12 SIVA Tools (Foundation, Strict, Delegated layers)
- QTLE Scoring Model (Quality, Timing, Lifecycle, Engagement)
- Intelligence Packs and Personas
- Multi-Agent AI Orchestration (11 AI departments)
- Frontend stack (Next.js 14, Zustand, Tailwind, Framer Motion)
- Backend (UPR OS, PostgreSQL, Neo4j, LLM Router)
- Vertical Model (Banking → Insurance → Real Estate)
- SLM (Small Language Model) roadmap
- Business model and GTM strategy
- 5-Phase roadmap (S133-S217, $100K → $100M ARR)

## Response Guidelines:
1. Be specific and technical - the founder wants depth, not surface level
2. Always explain WHY a technology was chosen, not just what it does
3. Connect concepts to 2030 vision when relevant
4. Reference specific modules from the learning content when applicable
5. Use markdown formatting with **bold** headers and bullet points
6. Keep responses focused and actionable
7. If the query is about something not in SIVA OS, explain what SIVA actually uses instead

## Key SIVA OS Principles:
- SIVA is the OS, PremiumRadar is ONE distribution
- "SIVA is the Siri of Sales"
- AI Sales OS is the category we're creating
- Evidence-Grounded or Silent (no hallucinations)
- No Hardcode Doctrine (all config from Packs/Personas)
- SIVA Configures SIVA (Super Admin is conversation-based)`;

export async function POST(request: NextRequest) {
  try {
    const { query, context } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Check if we have API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Return a signal to use fallback
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 503 }
      );
    }

    // Call Anthropic API directly
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Context about available learning modules:\n${context}\n\n---\n\nUser question: ${query}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API error:', errorData);
      return NextResponse.json(
        { error: 'AI service unavailable' },
        { status: 503 }
      );
    }

    const data = await response.json();

    // Extract text from the response
    const responseText = data.content
      ?.filter((block: { type: string }) => block.type === 'text')
      ?.map((block: { text: string }) => block.text)
      ?.join('\n') || 'No response generated';

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error('Learn Agent error:', error);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
}
