import { DurableObject } from "cloudflare:workers";
import { BlogRepository } from "./blog/BlogRepository";
import { RssFeedBuilder } from "./feeds/RssFeedBuilder";

export class MyDurableObject extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}
}

// An artist image in Last.fm's {size, #text} shape — the shape the client reads.
type ArtistImage = { size: string; "#text": string };

// MusicBrainz wants a descriptive User-Agent with contact info on every request.
const MB_USER_AGENT =
	"SebaSphere-Blog/1.0 (https://notification.lachupacabra.club)";

// Resolve an artist's picture *exactly* from their MusicBrainz ID — never by
// name — so we never grab the wrong artist. Two exact sources are tried in
// order; if both come up empty we return null and the caller keeps whatever
// Last.fm gave (its placeholder star). No fuzzy name search.
async function resolveArtistImageByMbid(
	mbid: string,
): Promise<ArtistImage[] | null> {
	// 1) TheAudioDB, keyed directly by the MusicBrainz ID (one request, and it
	//    tolerates bursts better than MusicBrainz's ~1 req/sec limit).
	try {
		const res = await fetch(
			`https://www.theaudiodb.com/api/v1/json/2/artist-mb.php?i=${mbid}`,
		);
		if (res.ok) {
			const data = (await res.json()) as {
				artists?: Array<{ strArtistThumb?: string | null }> | null;
			};
			const thumb = data.artists?.[0]?.strArtistThumb;
			if (thumb) {
				// One high-res thumb; expose it under the sizes the client picks from.
				return [
					{ size: "small", "#text": `${thumb}/preview` },
					{ size: "medium", "#text": `${thumb}/preview` },
					{ size: "large", "#text": thumb },
					{ size: "extralarge", "#text": thumb },
				];
			}
		}
	} catch {
		// fall through to MusicBrainz
	}

	// 2) MusicBrainz relations for this exact ID → the artist's exact Deezer ID →
	//    Deezer's picture. This resolves niche artists TheAudioDB doesn't carry.
	try {
		const mbRes = await fetch(
			`https://musicbrainz.org/ws/2/artist/${mbid}?inc=url-rels&fmt=json`,
			{ headers: { "User-Agent": MB_USER_AGENT } },
		);
		if (!mbRes.ok) return null;
		const mb = (await mbRes.json()) as {
			relations?: Array<{ url?: { resource?: string } }>;
		};
		let deezerId: string | undefined;
		for (const rel of mb.relations ?? []) {
			const match = rel.url?.resource?.match(
				/deezer\.com\/artist\/(\d+)/,
			);
			if (match) {
				deezerId = match[1];
				break;
			}
		}
		if (!deezerId) return null;

		const dzRes = await fetch(`https://api.deezer.com/artist/${deezerId}`);
		if (!dzRes.ok) return null;
		const dz = (await dzRes.json()) as {
			picture_small?: string;
			picture_medium?: string;
			picture_big?: string;
			picture_xl?: string;
		};
		if (!dz.picture_medium) return null;
		return [
			{ size: "small", "#text": dz.picture_small ?? "" },
			{ size: "medium", "#text": dz.picture_medium ?? "" },
			{ size: "large", "#text": dz.picture_big ?? "" },
			{ size: "extralarge", "#text": dz.picture_xl ?? "" },
		];
	} catch {
		return null;
	}
}

export default {
	async fetch(request, _env, ctx): Promise<Response> {
		if (request.method !== "GET" && request.method !== "HEAD") {
			return new Response("Method Not Allowed", {status: 405});
		}

		const url = new URL(request.url);
		const path = url.pathname.replace(/\/+$/, "");

		try {
			switch (path) {
				case "/latest-tracks": {
					// TODO: change the API key into a token (good thing this isn't too important)
					const api_key = "3a1a63c7acb35a7a8395ad86365cfb49";
					if (!api_key) {
						return new Response("API key not configured", {status: 500});
					}
					// lastfm get
					const lastfmUrl = `http://ws.audioscrobbler.com/2.0/?method=user.getRecentTracks&user=SebaSphere&api_key=${api_key}&format=json`;
					const lastfmResponse = await fetch(lastfmUrl);
					if (!lastfmResponse.ok) {
						throw new Error(`Failed to fetch tracks: ${lastfmResponse.statusText}`);
					}
					const tracks = await lastfmResponse.json();

					return new Response(JSON.stringify(tracks), {
						headers: {
							"Content-Type": "application/json",
							"Access-Control-Allow-Origin": "*",
							"Cache-Control": "no-store",
						},
					});
				}
				case "/top-artists": {
					// Enriching every artist means a handful of upstream calls each,
					// so serve a cached copy when we have one. Top artists over a
					// month barely move, and this also keeps us well under
					// MusicBrainz's ~1 req/sec rate limit (we only enrich on a miss).
					const cache = caches.default;
					if (request.method === "GET") {
						const hit = await cache.match(request);
						if (hit) return hit;
					}

					// TODO: change the API key into a token (good thing this isn't too important)
					const api_key = "3a1a63c7acb35a7a8395ad86365cfb49";
					if (!api_key) {
						return new Response("API key not configured", {status: 500});
					}
					// lastfm get
					const lastfmUrl = `http://ws.audioscrobbler.com/2.0/?method=user.getTopArtists&user=SebaSphere&period=1month&api_key=${api_key}&format=json`;
					const lastfmResponse = await fetch(lastfmUrl);
					if (!lastfmResponse.ok) {
						throw new Error(`Failed to fetch top artists: ${lastfmResponse.statusText}`);
					}
					const topArtists = await lastfmResponse.json() as {
						topartists?: {
							artist?: Array<{
								mbid?: string;
								image?: Array<{ size?: string; "#text"?: string }>;
							}>;
						};
					};

					// Last.fm no longer returns real artist pictures (just a
					// placeholder star). Resolve each one *exactly* from its
					// MusicBrainz ID and splice it into the image array, keeping the
					// {size, #text} shape the client already reads. Artists with no
					// mbid (or no exact hit) keep the Last.fm placeholder.
					const artists = topArtists.topartists?.artist ?? [];
					await Promise.all(
						artists.map(async (artist) => {
							if (!artist.mbid) return;
							const image = await resolveArtistImageByMbid(artist.mbid);
							if (image) artist.image = image;
						}),
					);

					const response = new Response(JSON.stringify(topArtists), {
						headers: {
							"Content-Type": "application/json",
							"Access-Control-Allow-Origin": "*",
							// Cache for 6h (browser + our own edge cache below).
							"Cache-Control": "public, max-age=21600",
						},
					});
					if (request.method === "GET") {
						ctx.waitUntil(cache.put(request, response.clone()));
					}
					return response;
				}
				case "/rss": {
					const posts = await new BlogRepository().listPosts();
					const xml = RssFeedBuilder.forFeedUrl(url.toString()).build(posts);
					return new Response(xml, {
						headers: {
							"Content-Type": "text/xml; charset=utf-8",
							"Cache-Control": "no-store",
							"X-Content-Type-Options": "nosniff",
						},
					});
				}
				case "/health": {
					return new Response(JSON.stringify({status: "ok"}), {
						headers: {"Content-Type": "application/json"},
					});
				}
				default: {
					return new Response("Not Found", {status: 404});
				}
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : "unknown error";
			return new Response(`Failed to process request: ${message}`, {
				status: 502,
			});
		}
	},
} satisfies ExportedHandler<Env>;
