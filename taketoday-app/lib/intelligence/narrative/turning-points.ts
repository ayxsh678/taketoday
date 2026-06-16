import 'server-only';
import type { ClassifiedStoryLink, StoryRelationshipType } from '@/lib/intelligence/types';

// Relationship types that signal a narrative turning point
const TURNING_POINT_TYPES: StoryRelationshipType[] = [
  'CONTRADICTION',
  'REFUTATION',
  'ESCALATION',
];

const TURNING_POINT_CONFIDENCE_THRESHOLD = 0.72;

// Inspect classified story links for signals that the story has taken a new turn.
// Returns descriptions of new unresolved threads to add to the chain narrative.
// Pure function — no DB writes here; caller decides whether to persist.
export function detectTurningPointsFromLinks(
  links: ClassifiedStoryLink[],
  sourceHeadline: string,
): string[] {
  const threads: string[] = [];

  for (const link of links) {
    if (!TURNING_POINT_TYPES.includes(link.relationshipType)) continue;
    if (link.confidence < TURNING_POINT_CONFIDENCE_THRESHOLD) continue;

    const description = buildThreadDescription(link, sourceHeadline);
    if (description) threads.push(description);
  }

  return threads;
}

function buildThreadDescription(link: ClassifiedStoryLink, sourceHeadline: string): string {
  if (link.causalExplanation) {
    // Use the LLM-generated explanation from the classifier — most informative
    return link.causalExplanation.slice(0, 120);
  }

  switch (link.relationshipType) {
    case 'CONTRADICTION':
      return `New article contradicts earlier reporting: "${sourceHeadline.slice(0, 80)}"`;
    case 'REFUTATION':
      return `Direct refutation detected: "${sourceHeadline.slice(0, 80)}"`;
    case 'ESCALATION':
      return `Story escalation: "${sourceHeadline.slice(0, 80)}"`;
    default:
      return '';
  }
}
