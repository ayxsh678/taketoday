import { callWithRouter } from './router';
import type { AITask } from './providers/types';

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
}

export async function generateJSON(
  prompt: string,
  task: AITask = 'social_caption',
): Promise<{ text: string; provider: string }> {
  const result = await callWithRouter({
    task,
    risk: 'LOW',
    input: {
      system: 'You are a social media content strategist. Return ONLY valid JSON with no markdown, no code fences.',
      user: prompt,
      temperature: 0.7,
    },
  });

  const text = stripFences(result.text);
  return { text, provider: result.provider };
}
