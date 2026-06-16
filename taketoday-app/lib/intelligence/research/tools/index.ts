import { runWebSearch } from './web-search';
import { runWikidataLookup } from './wikidata';
import { runNewsHistory } from './news-history';
import { runFinancialData } from './financial';

export { runWebSearch, runWikidataLookup, runNewsHistory, runFinancialData };

// OpenAI tool definitions for the ReAct loop
export const TOOL_DEFINITIONS = [
  {
    type: 'function' as const,
    function: {
      name: 'web_search',
      description: 'Search the web for current information about a topic. Use for recent news, facts, and corroboration.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query string' },
          numResults: { type: 'number', description: 'Number of results (1-10, default 5)', default: 5 },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'wikidata_lookup',
      description: 'Look up structured factual data about a person, organization, or entity from Wikidata.',
      parameters: {
        type: 'object',
        properties: {
          entityName: { type: 'string', description: 'Full name of the entity to look up' },
        },
        required: ['entityName'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'news_history',
      description: 'Search news archives for historical coverage of a topic over a time period.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search topic or query' },
          dateRange: {
            type: 'string',
            enum: ['week', 'month', 'year', 'all'],
            description: 'How far back to search',
            default: 'year',
          },
          numResults: { type: 'number', default: 5 },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'financial_data',
      description: 'Fetch financial data for a publicly traded company by ticker symbol.',
      parameters: {
        type: 'object',
        properties: {
          ticker: { type: 'string', description: 'Stock ticker symbol (e.g. AAPL, MSFT, TSLA)' },
        },
        required: ['ticker'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'synthesize',
      description: 'Produce the final research dossier after gathering sufficient evidence. Call this when research is complete.',
      parameters: {
        type: 'object',
        properties: {
          executiveSummary: {
            type: 'string',
            description: 'Comprehensive 150-300 word summary of the story, key actors, and current state',
          },
          keyFindings: {
            type: 'array',
            items: { type: 'string' },
            description: '5-8 specific, factual findings from research. Each under 30 words.',
            minItems: 3,
            maxItems: 8,
          },
          timeline: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string', description: 'ISO date string YYYY-MM-DD' },
                title: { type: 'string' },
                description: { type: 'string' },
                importance: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              },
              required: ['date', 'title', 'description', 'importance'],
            },
            description: 'Chronological timeline of key events in this story',
            minItems: 1,
          },
          openQuestions: {
            type: 'array',
            items: { type: 'string' },
            description: '3-6 specific unanswered questions this story still needs to resolve',
            minItems: 1,
            maxItems: 6,
          },
          watchList: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                entity: { type: 'string' },
                description: { type: 'string' },
                triggerKeywords: { type: 'array', items: { type: 'string' } },
                importance: { type: 'string', enum: ['high', 'medium', 'low'] },
              },
              required: ['entity', 'description', 'triggerKeywords', 'importance'],
            },
            description: 'Entities to monitor for future developments',
            minItems: 1,
            maxItems: 5,
          },
          riskFactors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                likelihood: { type: 'string', enum: ['low', 'medium', 'high'] },
                impact: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                entityIds: { type: 'array', items: { type: 'string' } },
              },
              required: ['description', 'likelihood', 'impact', 'entityIds'],
            },
            description: 'Key risk factors and their assessment',
            maxItems: 5,
          },
          confidenceScore: {
            type: 'number',
            description: 'Research confidence 0-100 based on source quality and corroboration',
            minimum: 0,
            maximum: 100,
          },
        },
        required: ['executiveSummary', 'keyFindings', 'timeline', 'openQuestions', 'watchList', 'confidenceScore'],
      },
    },
  },
] as const;

// Dispatch a tool call to the correct implementation
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case 'web_search':
      return runWebSearch(args.query as string, (args.numResults as number) ?? 5);

    case 'wikidata_lookup':
      return runWikidataLookup(args.entityName as string);

    case 'news_history':
      return runNewsHistory(args.query as string, {
        dateRange: (args.dateRange as 'week' | 'month' | 'year' | 'all') ?? 'year',
        numResults: (args.numResults as number) ?? 5,
      });

    case 'financial_data':
      return runFinancialData(args.ticker as string);

    case 'synthesize':
      // synthesize is the terminal action — its args ARE the result; no execution needed
      return { synthesized: true };

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
