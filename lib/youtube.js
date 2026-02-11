const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 30;

export async function handleYouTube(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (path === "/api/search") {
    const query = url.searchParams.get("q");

    if (!query) {
      return json({ error: "Missing search query" }, 400);
    }

    let limit = parseInt(url.searchParams.get("limit"));

    // Safety limit handling
    if (isNaN(limit) || limit <= 0) {
      limit = DEFAULT_LIMIT;
    }

    if (limit > MAX_LIMIT) {
      limit = MAX_LIMIT;
    }

    return await searchVideos(query, limit);
  }

  return null;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS
  });
}

async function searchVideos(query, limit) {
  const response = await fetch(
    `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9"
      }
    }
  );

  if (!response.ok) {
    return json({ error: "Search failed" }, 500);
  }

  const html = await response.text();

  const match = html.match(/var ytInitialData\s*=\s*(\{.+?\});/s);
  if (!match) {
    return json({ error: "Failed to parse search data" }, 500);
  }

  const data = JSON.parse(match[1]);

  const contents =
    data.contents?.twoColumnSearchResultsRenderer?.primaryContents
      ?.sectionListRenderer?.contents || [];

  const results = [];

  for (const section of contents) {
    const items = section.itemSectionRenderer?.contents || [];

    for (const item of items) {
      const video = item.videoRenderer;
      if (!video) continue;

      results.push({
        id: video.videoId,
        title: video.title?.runs?.[0]?.text || ""
      });

      if (results.length >= limit) break;
    }

    if (results.length >= limit) break;
  }

  return json({
    query,
    count: results.length,
    results
  });
}
