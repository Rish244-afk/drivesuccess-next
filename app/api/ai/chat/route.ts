import { NextResponse } from 'next/server';
import { processAIChatAction } from '@/actions/aiAssistant';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const rateCheck = checkRateLimit(`ai_chat_api_${ip}`, { limit: 20, windowMs: 10 * 60 * 1000 });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many chat requests. Please slow down and try again in a few minutes.',
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body.message !== 'string' || !body.message.trim()) {
      return NextResponse.json({ success: false, message: 'Valid message string is required.' }, { status: 400 });
    }

    if (body.message.length > 1000) {
      return NextResponse.json({ success: false, message: 'Message payload too large (max 1000 characters).' }, { status: 400 });
    }

    const history = Array.isArray(body.history) ? body.history.slice(-15) : [];

    const result = await processAIChatAction(body.message, history);
    return NextResponse.json(result);
  } catch (error) {
    console.error('API /api/ai/chat POST Error:', error);
    return NextResponse.json({ success: false, message: 'Internal AI Chat Error' }, { status: 500 });
  }
}
