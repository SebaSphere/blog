const ENDPOINT = "https://notification.lachupacabra.club/latest-tracks";

export interface RecentTracksResponse {
  recenttracks?: {
    track?: Array<{
      name?: string;
      url?: string;
      artist?: { "#text"?: string };
      album?: { "#text"?: string };
      image?: Array<{ size?: string; "#text"?: string }>;
      "@attr"?: { nowplaying?: string };
      date?: { uts?: string; "#text"?: string };
    }>;
  };
}

export async function fetchRecentTracks(): Promise<RecentTracksResponse> {
  const res = await fetch(ENDPOINT);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<RecentTracksResponse>;
}
