import { Feed } from "feed";
import { CONFIG } from "../config";
import type { BlogPost } from "../dto/BlogPost";

export interface RssChannelMeta {
	title: string;
	description: string;
	siteUrl: string;
	feedUrl: string;
	language: string;
}

export class RssFeedBuilder {
	constructor(private readonly meta: RssChannelMeta) {}

	static forFeedUrl(feedUrl: string): RssFeedBuilder {
		return new RssFeedBuilder({
			title: CONFIG.feed.title,
			description: CONFIG.feed.description,
			language: CONFIG.feed.language,
			siteUrl: CONFIG.siteUrl,
			feedUrl,
		});
	}

	build(posts: readonly BlogPost[]): string {
		const feed = new Feed({
			title: this.meta.title,
			description: this.meta.description,
			id: `${this.meta.siteUrl}/`,
			link: `${this.meta.siteUrl}/`,
			language: this.meta.language,
			feedLinks: { rss2: this.meta.feedUrl },
			copyright: "All Rights Reserved",
			updated: new Date(),
		});

		[...posts]
			.sort((a, b) => b.date.getTime() - a.date.getTime())
			.forEach((post) => {
				feed.addItem({
					title: post.title,
					id: new URL(post.url).pathname,
					link: post.url,
					date: post.date,
					category: post.tags.map((t) => ({ name: t })),
				});
			});

		return feed.rss2();
	}
}
