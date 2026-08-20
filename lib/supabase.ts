import type { Mezmur } from "./constants";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

function pgQuoteInValue(v: string): string {
  return `"${String(v).replace(/"/g, '\\"')}"`;
}

export function pgInParam(values: Iterable<string>): string {
  return `in.(${[...values].map(pgQuoteInValue).join(",")})`;
}

export function pgArrayLiteral(values: Iterable<string>): string {
  const quoted = [...values].map((v) => `"${String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
  return `{${quoted.join(",")}}`;
}

export async function mezmurRestFetch(params: URLSearchParams) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/mezmur?${params.toString()}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!resp.ok) throw new Error(`Supabase fetch failed: ${resp.status}`);
  return resp.json();
}

export interface MezmurFilters {
  topics?: Set<string>;
  languages?: Set<string>;
  speeds?: Set<string>;
  lengths?: Set<string>;
  search?: string;
  sort?: string;
}

export async function fetchMezmur({
  topics,
  languages,
  speeds,
  lengths,
  search,
  sort,
}: MezmurFilters): Promise<Mezmur[]> {
  const params = new URLSearchParams();
  params.set("select", "*");
  params.set("order", sort || "title.asc");
  if (topics && topics.size > 0) params.set("topics", `ov.${pgArrayLiteral(topics)}`);
  if (languages && languages.size > 0) params.set("language", pgInParam(languages));
  if (speeds && speeds.size > 0) params.set("speed", pgInParam(speeds));
  if (lengths && lengths.size > 0) params.set("length", pgInParam(lengths));
  if (search) params.set("title", `ilike.*${search}*`);
  return mezmurRestFetch(params);
}

export async function fetchDistinctTopics(): Promise<string[]> {
  const params = new URLSearchParams({ select: "topics" });
  const rows = (await mezmurRestFetch(params)) as { topics: string[] }[];
  const all = rows.flatMap((r) => r.topics || []);
  return [...new Set(all)].sort();
}
