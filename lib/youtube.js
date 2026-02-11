// ===============================
// YOUTUBE MODULE FOR _worker.js
// ===============================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

export async function handleYouTube(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {

    // ================= VIDEO =================
    if (path === "/api/video") {
      const videoUrl = url.searchParams.get("url");
      if (!videoUrl) {
        return json({ error: "Missing video URL" }, 400);
      }
      return await getVideoInfo(videoUrl);
    }

    // ================= SEARCH =================
    if (path === "/api/search") {
      const query = url.searchParams.get("q");
      if (!query) {
        return json({ error: "Missing search query" }, 400);
      }
      return await searchVideos(query);
    }

    // ================= CHANNEL =================
    if (path === "/api/channel") {
      const channelUrl = url.searchParams.get("url");
      if (!channelUrl) {
        return json({ error: "Missing channel URL" }, 400);
      }
      return await getChannelInfo(channelUrl);
    }

    // ================= PLAYLIST =================
    if (path === "/api/playlist") {
      const playlistUrl = url.searchParams.get("url");
      if (!playlistUrl) {
        return json({ error: "Missing playlist URL" }, 400);
      }
      return await getPlaylistInfo(playlistUrl);
    }

    // ================= TRANSCRIPT =================
    if (path === "/api/transcript") {
      const videoUrl = url.searchParams.get("url");
      if (!videoUrl) {
        return json({ error: "Missing video URL" }, 400);
      }
      return await getTranscript(videoUrl);
    }

    return null; // important for _worker.js fallback

  } catch (error) {
    return json({ error: error.message }, 500);
  }
}

// ===============================
// CORE FUNCTIONS
// ===============================

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: CORS_HEADERS
  });
}

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// ================= VIDEO INFO =================

async function getVideoInfo(videoUrl) {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    return json({ error: "Invalid YouTube URL" }, 400);
  }

  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });

  if (!response.ok) {
    return json({ error: "Failed to fetch video page" }, 500);
  }

  const html = await response.text();

  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(" - YouTube", "") : null;

  return json({
    id: videoId,
    title,
    thumbnails: {
      high: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      maxres: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
    },
    url: `https://www.youtube.com/watch?v=${videoId}`
  });
}

// ================= SEARCH =================

async function searchVideos(query) {
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
  const videoMatches = [...html.matchAll(/"videoId":"(.*?)"/g)];

  const uniqueIds = [...new Set(videoMatches.map(m => m[1]))].slice(0, 10);

  const results = uniqueIds.map(id => ({
    id,
    url: `https://www.youtube.com/watch?v=${id}`,
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
  }));

  return json({
    query,
    count: results.length,
    results
  });
}

// ================= CHANNEL =================

async function getChannelInfo(channelUrl) {
  const response = await fetch(channelUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (!response.ok) {
    return json({ error: "Failed to fetch channel" }, 500);
  }

  const html = await response.text();
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);

  return json({
    title: titleMatch ? titleMatch[1] : null,
    url: channelUrl
  });
}

// ================= PLAYLIST =================

async function getPlaylistInfo(playlistUrl) {
  const match = playlistUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (!match) {
    return json({ error: "Invalid playlist URL" }, 400);
  }

  const playlistId = match[1];

  return json({
    id: playlistId,
    url: `https://www.youtube.com/playlist?list=${playlistId}`
  });
}

// ================= TRANSCRIPT =================

async function getTranscript(videoUrl) {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    return json({ error: "Invalid YouTube URL" }, 400);
  }

  return json({
    videoId,
    message: "Transcript extraction requires advanced parsing. Add later."
  });
}
