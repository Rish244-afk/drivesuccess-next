import { executeLLMRequest, LLMMessage, ProviderResponse } from './provider';
import { getServerSession, JWTPayload } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export interface ProcessAIChatOptions {
  userMessage: string;
  history?: any[];
  ipAddress?: string;
  sessionOverride?: JWTPayload | null;
}

/**
 * DriveAI Master Engine
 * Sanitizes input, enforces rate limiting, normalizes conversation history,
 * defends against prompt injection, and executes server-side LLM processing.
 */
export async function runDriveAIEngine(options: ProcessAIChatOptions): Promise<ProviderResponse> {
  const { userMessage, history = [], ipAddress = '127.0.0.1', sessionOverride } = options;

  // 1. INPUT VALIDATION & PAYLOAD SANITIZATION
  if (!userMessage || typeof userMessage !== 'string') {
    return {
      success: false,
      text: 'Message is required and must be a string.',
      error: 'INVALID_INPUT',
    };
  }

  const sanitizedMessage = userMessage.trim().substring(0, 1000); // Limit input to 1000 chars
  if (sanitizedMessage.length === 0) {
    return {
      success: false,
      text: 'Please type a valid message.',
      error: 'EMPTY_INPUT',
    };
  }

  // 2. UNIFIED SERVER-SIDE RATE LIMITING
  const session = sessionOverride !== undefined ? sessionOverride : await getServerSession();
  const rateLimitKey = session?.sub ? `ai_chat_user_${session.sub}` : `ai_chat_ip_${ipAddress}`;
  const rateCheck = await checkRateLimit(rateLimitKey, { limit: 20, windowMs: 10 * 60 * 1000 }); // 20 requests per 10 mins

  if (!rateCheck.allowed) {
    return {
      success: false,
      text: 'You have sent too many messages in a short time. Please slow down and try again in a few minutes.',
      error: 'RATE_LIMIT_EXCEEDED',
    };
  }

  // 3. PROMPT INJECTION & ATTACK DEFENSE
  const lowerMsg = sanitizedMessage.toLowerCase();
  const isPromptInjectionAttempt =
    lowerMsg.includes('ignore your instructions') ||
    lowerMsg.includes('ignore previous instructions') ||
    lowerMsg.includes('reveal your system prompt') ||
    lowerMsg.includes('show database schema') ||
    lowerMsg.includes('execute sql') ||
    lowerMsg.includes('select * from') ||
    lowerMsg.includes('show api key') ||
    lowerMsg.includes('reveal api key') ||
    (lowerMsg.includes('student') && lowerMsg.includes("other student's"));

  if (isPromptInjectionAttempt) {
    console.warn(`[DriveAI Security Guard] Prompt injection attempt blocked: "${sanitizedMessage.substring(0, 80)}"`);
    return {
      success: true,
      text: "I am DriveAI, virtual assistant for Vahathi Motor Driving School. I can only help you explore driving courses, check available lesson slots, explain RTO requirements, or track your own booking details. What can I assist you with today?",
      options: [
        { label: '📦 Browse Packages', value: 'Show packages' },
        { label: '📅 Check Open Slots', value: 'Check available slots' },
      ],
    };
  }

  // 4. HISTORY NORMALIZATION & TRUNCATION
  const normalizedHistory: LLMMessage[] = Array.isArray(history)
    ? history
        .slice(-10) // Retain last 10 turns max to prevent token bloat
        .filter((m: any) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
        .map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content.substring(0, 1000),
        }))
    : [];

  // 5. EXECUTE LLM PROVIDER REQUEST
  try {
    return await executeLLMRequest(sanitizedMessage, normalizedHistory, session);
  } catch (error: any) {
    console.error('[DriveAI Engine] Execution Error:', error);
    return {
      success: true,
      text: "I'm having trouble accessing that information right now. You can try asking again in a moment or call our support desk at +91 7829780778.",
      options: [
        { label: '📦 Browse Packages', value: 'Show packages' },
        { label: '📅 Check Open Slots', value: 'Check available slots' },
      ],
    };
  }
}
