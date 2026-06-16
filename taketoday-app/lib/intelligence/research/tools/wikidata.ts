import 'server-only';

export interface WikidataToolOutput {
  found: boolean;
  entityId?: string;
  label?: string;
  description?: string;
  aliases?: string[];
  properties?: Record<string, string>;
  wikidataUrl?: string;
}

interface WikidataSearchResponse {
  search?: Array<{
    id: string;
    label?: string;
    description?: string;
    aliases?: string[];
  }>;
}

interface WikidataEntityResponse {
  entities?: Record<string, {
    labels?: Record<string, { value: string }>;
    descriptions?: Record<string, { value: string }>;
    aliases?: Record<string, Array<{ value: string }>>;
    claims?: Record<string, Array<{
      mainsnak?: {
        datavalue?: {
          value: string | { time?: string; id?: string; text?: string; amount?: string };
          type: string;
        };
        property: string;
      };
    }>>;
  }>;
}

// Key Wikidata property IDs we care about for news research
const INTERESTING_PROPS: Record<string, string> = {
  P31: 'instance_of',
  P17: 'country',
  P571: 'inception_date',
  P576: 'dissolution_date',
  P856: 'website',
  P18: 'image',
  P27: 'citizenship',
  P569: 'date_of_birth',
  P570: 'date_of_death',
  P159: 'headquarters',
  P452: 'industry',
  P1448: 'official_name',
};

export async function runWikidataLookup(entityName: string): Promise<WikidataToolOutput> {
  try {
    // Step 1: Search for entity
    const searchUrl = new URL('https://www.wikidata.org/w/api.php');
    searchUrl.searchParams.set('action', 'wbsearchentities');
    searchUrl.searchParams.set('search', entityName);
    searchUrl.searchParams.set('language', 'en');
    searchUrl.searchParams.set('limit', '1');
    searchUrl.searchParams.set('format', 'json');

    const searchRes = await fetch(searchUrl.toString(), {
      headers: { 'User-Agent': 'TakeToday/1.0 (news research agent)' },
      signal: AbortSignal.timeout(5000),
    });

    if (!searchRes.ok) return { found: false };

    const searchData = (await searchRes.json()) as WikidataSearchResponse;
    const match = searchData.search?.[0];
    if (!match) return { found: false };

    // Step 2: Fetch entity data
    const entityUrl = new URL('https://www.wikidata.org/w/api.php');
    entityUrl.searchParams.set('action', 'wbgetentities');
    entityUrl.searchParams.set('ids', match.id);
    entityUrl.searchParams.set('props', 'labels|descriptions|aliases|claims');
    entityUrl.searchParams.set('languages', 'en');
    entityUrl.searchParams.set('format', 'json');

    const entityRes = await fetch(entityUrl.toString(), {
      headers: { 'User-Agent': 'TakeToday/1.0 (news research agent)' },
      signal: AbortSignal.timeout(5000),
    });

    if (!entityRes.ok) {
      return {
        found: true,
        entityId: match.id,
        label: match.label,
        description: match.description,
        aliases: match.aliases,
        wikidataUrl: `https://www.wikidata.org/wiki/${match.id}`,
      };
    }

    const entityData = (await entityRes.json()) as WikidataEntityResponse;
    const entity = entityData.entities?.[match.id];
    if (!entity) return { found: false };

    const label = entity.labels?.en?.value ?? match.label;
    const description = entity.descriptions?.en?.value ?? match.description;
    const aliases = entity.aliases?.en?.map((a) => a.value) ?? match.aliases ?? [];

    // Extract a few interesting properties as human-readable strings
    const properties: Record<string, string> = {};
    for (const [propId, propName] of Object.entries(INTERESTING_PROPS)) {
      const claim = entity.claims?.[propId]?.[0];
      if (!claim?.mainsnak?.datavalue) continue;
      const dv = claim.mainsnak.datavalue;
      if (dv.type === 'string' && typeof dv.value === 'string') {
        properties[propName] = dv.value;
      } else if (dv.type === 'time' && typeof dv.value === 'object' && 'time' in dv.value && dv.value.time) {
        properties[propName] = dv.value.time.slice(1, 11); // ISO date
      }
    }

    return {
      found: true,
      entityId: match.id,
      label,
      description,
      aliases: aliases.slice(0, 5),
      properties,
      wikidataUrl: `https://www.wikidata.org/wiki/${match.id}`,
    };
  } catch {
    return { found: false };
  }
}
