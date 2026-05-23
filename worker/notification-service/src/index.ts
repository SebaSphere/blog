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
