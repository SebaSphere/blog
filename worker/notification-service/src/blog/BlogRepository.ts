import { BlogPost } from "../dto/BlogPost";
import {CONFIG} from "../config";

interface GitHubContentEntry {
	name: string;
	type: string;
}

export class BlogRepository {
	constructor(
		private readonly repo: string = CONFIG.repo,
		private readonly path: string = CONFIG.blogDir,
		private readonly cacheTtlSeconds: number = CONFIG.cacheTtlSeconds,
	) {}

	async listPosts(): Promise<BlogPost[]> {
		const entries = await this.fetchDirectory();
		const markdownFiles = entries
			.filter((e) => e.type === "file" && e.name.endsWith(".md"))
			.sort((a, b) => a.name.localeCompare(b.name));

		const posts: BlogPost[] = [];
		markdownFiles.forEach((file, index) => {
			const post = BlogPost.fromFilename(file.name, (index + 1).toString());
			if (post) posts.push(post);
		});
		return posts;
	}

	private async fetchDirectory(): Promise<GitHubContentEntry[]> {
		const url = `https://api.github.com/repos/${this.repo}/contents/${this.path}`;
		const resp = await fetch(url, {
			headers: {
				"User-Agent": CONFIG.userAgent,
				Accept: "application/vnd.github+json",
			},
			cf: { cacheTtl: this.cacheTtlSeconds, cacheEverything: true },
		});
		if (!resp.ok) {
			throw new Error(`GitHub API returned ${resp.status}`);
		}
		return (await resp.json()) as GitHubContentEntry[];
	}
}
