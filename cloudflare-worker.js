const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}

function decodeHtml(value = "") {
  return value
    .replace(/<[^>]*>/g, " ")
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/\s+/g, " ")
    .trim();
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    const requestUrl = new URL(request.url);
    const query = requestUrl.searchParams.get("q")?.trim();

    if (!query) {
      return json({
        working: true,
        message: "Add ?q=your quote to search The Sopranos.",
        example: `${requestUrl.origin}/?q=dead`,
      });
    }

    if (query.length > 100) return json({ error: "Search is too long." }, 400);

    const braveQuery = `site:yarn.co/yarn-clip "The Sopranos" ${query}`;
    const braveUrl = `https://search.brave.com/search?q=${encodeURIComponent(braveQuery)}&source=web`;

    let response;
    try {
      response = await fetch(braveUrl, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
        },
        cf: { cacheTtl: 300, cacheEverything: true },
      });
    } catch {
      return json({ error: "Could not reach the search service." }, 502);
    }

    if (!response.ok) return json({ error: "The search service rejected the request." }, 502);

    const html = await response.text();
    const clipPattern = /https?:\/\/(?:[^/]+\.)?yarn\.co\/yarn-clip\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\/gif)?/gi;
    const results = [];
    const seen = new Set();

    for (const match of html.matchAll(clipPattern)) {
      const id = match[1].toLowerCase();
      if (seen.has(id)) continue;

      const start = Math.max(0, match.index - 3000);
      const end = Math.min(html.length, match.index + 4000);
      const context = decodeHtml(html.slice(start, end));
      const titleMatch = context.match(/YARN\s*\|\s*(.*?)\s*\|\s*The Sopranos\b/i);
      if (!titleMatch) continue;

      seen.add(id);
      results.push({
        id,
        quote: titleMatch[1],
        show: "The Sopranos",
        gif: `https://y.getyarn.io/${id}_text.gif`,
        thumbnail: `https://y.getyarn.io/${id}_thumb.jpg`,
        yarnPage: `https://memes.yarn.co/yarn-clip/${id}/gif`,
      });

      if (results.length >= 20) break;
    }

    return json({ query, count: results.length, results });
  },
};
