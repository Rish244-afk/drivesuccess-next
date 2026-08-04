import { NextResponse } from 'next/server';
import { processAIChatAction } from '@/actions/aiAssistant';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`ai_chat_${ip}`, { limit: 20, windowMs: 10 * 60 * 1000 });
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, message: 'Too many chat requests. Please slow down.' }, { status: 429 });
    }

    const { message, history } = await req.json();
    if (!message) {
      return NextResponse.json({ success: false, message: 'Message is required' }, { status: 400 });
    }

    const result = await processAIChatAction(message, history);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal AI Chat Error' }, { status: 500 });
  }
}
