export const CONFIG = {
	repo: "SebaSphere/blog",
	blogDir: "src/assets/blog",
	siteUrl: "https://sebasphere.github.io/blog",
	feed: {
		title: "SebaSphere's Blog",
		description:
			"Cool things I've found or doing, general life events, and anything else I have in mind.",
		language: "en",
	},
	cacheTtlSeconds: 3600,
	userAgent: "sebasphere-blog-worker",
} as const;
