const ENDPOINT = "https://notification.lachupacabra.club/top-artists";

export interface TopArtistsResponse {
  topartists?: {
    artist?: Array<{
      name?: string;
      playcount?: string;
      url?: string;
      image?: Array<{ size?: string; "#text"?: string }>;
    }>;
  };
}

let pending: Promise<TopArtistsResponse> | null = null;

export function fetchTopArtists(): Promise<TopArtistsResponse> {
  if (!pending) {
    pending = fetch(ENDPOINT)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<TopArtistsResponse>;
      })
      .catch((err) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}

export function prefetchTopArtists(): void {
  fetchTopArtists().catch(() => {});
}
