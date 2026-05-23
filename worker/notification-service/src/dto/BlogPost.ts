import { CONFIG } from "../config";

export interface BlogPostJson {
	id: string;
	title: string;
	date: string;
	tags: string[];
	url: string;
	filename: string;
}

export class BlogPost {
	constructor(
		public readonly id: string,
		public readonly title: string,
		public readonly date: Date,
		public readonly tags: readonly string[],
		public readonly filename: string,
	) {}

	get url(): string {
		return `${CONFIG.siteUrl}/content/${this.id}`;
	}

	hasTag(tag: string): boolean {
		return this.tags.includes(tag);
	}

	hasAnyTag(tags: readonly string[]): boolean {
		return tags.some((t) => this.tags.includes(t));
	}

	toJSON(): BlogPostJson {
		return {
			id: this.id,
			title: this.title,
			date: this.date.toISOString(),
			tags: [...this.tags],
			url: this.url,
			filename: this.filename,
		};
	}

	// Filenames follow: MM-DD-YYYY_Title_tag1,tag2,tag3.md
	static fromFilename(filename: string, id: string): BlogPost | null {
		if (!filename.endsWith(".md")) return null;
		const [datePart, titlePart, tagPart] = filename.slice(0, -3).split("_");
		if (!datePart || !titlePart || !tagPart) return null;
		const date = new Date(datePart);
		if (Number.isNaN(date.getTime())) return null;
		const tags = tagPart
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean);
		return new BlogPost(id, titlePart, date, tags, filename);
	}
}
