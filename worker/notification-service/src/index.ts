import { DurableObject } from "cloudflare:workers";
import { BlogRepository } from "./blog/BlogRepository";
import { RssFeedBuilder } from "./feeds/RssFeedBuilder";

export class MyDurableObject extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
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
						headers: {"Content-Type": "application/json"},
					});
				}
				case "/top-artists": {
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
					const topArtists = await lastfmResponse.json();

					return new Response(JSON.stringify(topArtists), {
						headers: {"Content-Type": "application/json"},
					});
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
