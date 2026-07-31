import { NextResponse } from 'next/server';
import { processAIChatAction } from '@/actions/aiAssistant';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
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
