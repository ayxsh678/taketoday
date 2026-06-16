import 'server-only';
import { callLLMWithTool } from '@/lib/ai/llm';
import type { GeneratedQuestionSet, GeneratedQuestionRaw } from '@/lib/intelligence/types';

const PRIORITY_VALUES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;

const SYSTEM_PROMPT = `You are an investigative journalist and research analyst generating precise, answerable questions from news articles.

Generate FOUR categories of questions:

1. ANSWERED — Questions this article directly and completely answers.
   Focus: What factual claims does this article make? What causation does it explain?

2. OPEN — Questions this article raises but does NOT answer.
   Focus: What is still unexplained? What information is missing? What is assumed?

3. HISTORICAL — Questions linking this event to prior events.
   Focus: What precedents exist? What led here? Has this pattern occurred before?

4. FUTURE — Forward-looking investigative questions.
   Focus: What should be monitored next? What is the likely next development?

Rules:
- Questions must be SPECIFIC and name entities when possible
- No vague generalities ("What does this mean for the future?")
- Priority = CRITICAL if the question is the central unresolved thread
- verificationRequired = true if the article makes a claim needing external sourcing
- Generate 3-5 questions per category

EXAMPLES of good questions:
- "Did the SEC open a formal investigation into [Company] after the CFO departure?" (OPEN, HIGH)
- "When did [Company] last report negative quarterly earnings?" (HISTORICAL, MEDIUM)
- "Will [Company]'s board replace the CEO within the next 90 days?" (FUTURE, HIGH)`;

const QUESTION_ITEM_SCHEMA = {
  type: 'object' as const,
  properties: {
    text: { type: 'string' },
    priority: { type: 'string', enum: [...PRIORITY_VALUES] },
    verificationRequired: { type: 'boolean' },
  },
  required: ['text', 'priority', 'verificationRequired'],
};

const GENERATION_SCHEMA = {
  type: 'object',
  properties: {
    answered: { type: 'array', items: QUESTION_ITEM_SCHEMA, minItems: 1, maxItems: 5 },
    open: { type: 'array', items: QUESTION_ITEM_SCHEMA, minItems: 1, maxItems: 5 },
    historical: { type: 'array', items: QUESTION_ITEM_SCHEMA, minItems: 1, maxItems: 5 },
    future: { type: 'array', items: QUESTION_ITEM_SCHEMA, minItems: 1, maxItems: 5 },
  },
  required: ['answered', 'open', 'historical', 'future'],
};

export async function generateQuestions(
  headline: string,
  body: string,
  excerpt: string | null | undefined,
  relatedArticleSummaries: string[] = [],
  entityNames: string[] = [],
): Promise<GeneratedQuestionSet> {
  const articleText = [
    `Headline: ${headline}`,
    excerpt ? `Summary: ${excerpt}` : '',
    `\nArticle:\n${body.replace(/<[^>]+>/g, '').slice(0, 3500)}`,
  ]
    .filter(Boolean)
    .join('\n');

  const context = [
    entityNames.length > 0 ? `Key entities: ${entityNames.slice(0, 10).join(', ')}` : '',
    relatedArticleSummaries.length > 0
      ? `Related stories:\n${relatedArticleSummaries.slice(0, 3).map((s, i) => `${i + 1}. ${s}`).join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const userPrompt = `${articleText}${context ? `\n\n${context}` : ''}`;

  const raw = await callLLMWithTool<GeneratedQuestionSet>({
    system: SYSTEM_PROMPT,
    user: userPrompt,
    toolName: 'generate_questions',
    toolDescription: 'Generate four categories of investigative questions from a news article',
    schema: GENERATION_SCHEMA,
    maxTokens: 2000,
    temperature: 0.4,
  });

  // Validate + normalize priority values
  const normalize = (questions: GeneratedQuestionRaw[]): GeneratedQuestionRaw[] =>
    questions.filter(
      (q) =>
        q.text?.trim() &&
        PRIORITY_VALUES.includes(q.priority as (typeof PRIORITY_VALUES)[number]),
    );

  return {
    answered: normalize(raw.answered ?? []),
    open: normalize(raw.open ?? []),
    historical: normalize(raw.historical ?? []),
    future: normalize(raw.future ?? []),
  };
}
