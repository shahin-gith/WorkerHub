import { GoogleGenAI } from '@google/genai';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatGeminiError(err: unknown): Error {
  const raw = err instanceof Error ? err.message : String(err || 'Search request failed.');
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429') || raw.toLowerCase().includes('quota')) {
    return new Error('Live Google Search quota is currently exhausted for this API key. Please check your Gemini API quota or try again shortly.');
  }
  if (raw.includes('API_KEY') || raw.includes('401') || raw.includes('403')) {
    return new Error('Google Search API key is invalid or unauthorized. Please verify GEMINI_API_KEY in Secrets.');
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.message) {
      return new Error(String(parsed.error.message).split('\n')[0]);
    }
  } catch {
    // non-JSON message
  }
  return new Error(raw);
}

function extractGroundingLinks(response: {
  candidates?: Array<{
    groundingMetadata?: {
      groundingChunks?: Array<{
        web?: { uri?: string; title?: string };
      }>;
    };
  }>;
}): Array<{ title: string; uri: string }> {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const seen = new Set<string>();
  const links: Array<{ title: string; uri: string }> = [];
  for (const chunk of chunks) {
    const uri = chunk.web?.uri;
    const title = chunk.web?.title || uri || 'Source';
    if (uri && (uri.startsWith('https://') || uri.startsWith('http://')) && !seen.has(uri)) {
      seen.add(uri);
      links.push({ title, uri });
    }
  }
  return links;
}

function extractJsonBlock(text: string): unknown | null {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const arrayStart = candidate.indexOf('[');
    const arrayEnd = candidate.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd > arrayStart) {
      try {
        return JSON.parse(candidate.slice(arrayStart, arrayEnd + 1));
      } catch {
        return null;
      }
    }
    const objStart = candidate.indexOf('{');
    const objEnd = candidate.lastIndexOf('}');
    if (objStart !== -1 && objEnd > objStart) {
      try {
        return JSON.parse(candidate.slice(objStart, objEnd + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export interface SearchedCompanyItem {
  name: string;
  industry: 'Construction' | 'Marine Shipyard' | 'Manufacturing' | 'Process' | 'Services' | 'Other';
  address: string;
  description: string;
  sourceUrl?: string;
  sourceTitle?: string;
}

const VALID_INDUSTRIES = new Set([
  'Construction',
  'Marine Shipyard',
  'Manufacturing',
  'Process',
  'Services',
  'Other',
]);

export async function searchSingaporeCompanies(query: string): Promise<{
  companies: SearchedCompanyItem[];
  groundingLinks: Array<{ title: string; uri: string }>;
}> {
  const ai = getGeminiClient();
  let response;
  try {
    response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Search Google for real registered companies in Singapore matching: "${query}".
Return up to 6 matching Singapore companies as a JSON array ONLY (no extra commentary) where each item has:
- "name": official company name in Singapore (e.g. Pte Ltd)
- "industry": one of "Construction", "Marine Shipyard", "Manufacturing", "Process", "Services", "Other"
- "address": Singapore street address or industrial area if found, otherwise "Singapore"
- "description": concise 1-sentence summary of what the company does`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction:
          'You are a Singapore business directory assistant. Always use Google Search to verify real Singapore companies and output valid JSON array items.',
      },
    });
  } catch (err) {
    throw formatGeminiError(err);
  }

  const groundingLinks = extractGroundingLinks(response);
  const parsed = extractJsonBlock(response.text || '[]');
  const rawList = Array.isArray(parsed) ? parsed : [];

  const companies: SearchedCompanyItem[] = rawList
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && item.name))
    .slice(0, 6)
    .map((item, idx) => {
      const industryRaw = String(item.industry || 'Other');
      const industry = (
        VALID_INDUSTRIES.has(industryRaw) ? industryRaw : 'Other'
      ) as SearchedCompanyItem['industry'];
      const link = groundingLinks[idx] || groundingLinks[0];
      return {
        name: String(item.name).trim(),
        industry,
        address: String(item.address || 'Singapore').trim(),
        description: String(item.description || 'Registered business in Singapore').trim(),
        sourceUrl: link?.uri,
        sourceTitle: link?.title,
      };
    });

  return { companies, groundingLinks };
}

export async function searchWorkerHelpArticles(
  query: string,
  language: 'en' | 'bn'
): Promise<{
  summaryText: string;
  articles: Array<{
    title: string;
    summary: string;
    category: 'salary' | 'safety' | 'medical' | 'housing' | 'remittance' | 'general';
    url: string;
    sourceName: string;
  }>;
  groundingLinks: Array<{ title: string; uri: string }>;
}> {
  const ai = getGeminiClient();
  const langLabel = language === 'bn' ? 'Bengali (with clear English terms where helpful)' : 'English';
  let response;
  try {
    response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Search Google for helpful, official Singapore migrant worker guides, rights, and articles related to: "${query}".
Prioritize reliable Singapore sources like Ministry of Manpower (mom.gov.sg), Migrant Workers' Centre (mwc.org.sg), TWC2 (twc2.org.sg), HealthHub, or ICA.
Respond in ${langLabel} as a JSON object ONLY:
{
  "summaryText": "2-3 sentences practical overview answering the worker's query",
  "articles": [
    {
      "title": "Article or Guide Title",
      "summary": "2 sentences practical takeaway for migrant workers in Singapore",
      "category": "salary" | "safety" | "medical" | "housing" | "remittance" | "general",
      "sourceName": "Organization or Website Name"
    }
  ]
}
Include up to 5 articles.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction:
          'You are a practical migrant worker information assistant for Singapore. Use Google Search to locate accurate, up-to-date official guides and NGO resources. Output valid JSON.',
      },
    });
  } catch (err) {
    throw formatGeminiError(err);
  }

  const groundingLinks = extractGroundingLinks(response);
  const parsed = extractJsonBlock(response.text || '{}') as Record<string, unknown> | null;

  const validCats = new Set(['salary', 'safety', 'medical', 'housing', 'remittance', 'general']);
  const rawArticles = parsed && Array.isArray(parsed.articles) ? parsed.articles : [];

  const articles = rawArticles
    .filter((a): a is Record<string, unknown> => Boolean(a && typeof a === 'object' && a.title))
    .slice(0, 5)
    .map((a, idx) => {
      const catRaw = String(a.category || 'general');
      const category = (validCats.has(catRaw) ? catRaw : 'general') as
        | 'salary'
        | 'safety'
        | 'medical'
        | 'housing'
        | 'remittance'
        | 'general';
      const link = groundingLinks[idx] || groundingLinks[0];
      return {
        title: String(a.title).trim(),
        summary: String(a.summary || '').trim(),
        category,
        url: link?.uri || '',
        sourceName: String(a.sourceName || link?.title || 'Singapore Resource').trim(),
      };
    });

  return {
    summaryText:
      (parsed && typeof parsed.summaryText === 'string' && parsed.summaryText.trim()) ||
      (response.text && !parsed ? response.text.slice(0, 600) : 'Found related Singapore worker resources.'),
    articles,
    groundingLinks,
  };
}
