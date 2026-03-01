export class BlogFileList {
    blogDetails: BlogInformation[] = [];

    constructor() {
        const files = import.meta.glob('@/assets/blog/*', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
        for (const path in files) {
            this.blogDetails.push(new BlogInformation(path, files[path]!))
        }
    }
}

export class BlogInformation {
    path: string
    title: string = "";
    date: Date = new Date()
    contentRaw: string = "";
    tags: Array<string> = new Array<string>()

    constructor(path: string, content: string) {
        this.path = path
        this.contentRaw = content
        
        // Extract filename from path
        const filename = path.split('/').pop() || "";
        
        if (filename.endsWith(".md")) {
            const nameWithoutExtension = filename.substring(0, filename.length - 3)
            const rawInput = nameWithoutExtension.split('_');

            // Example: "02-28-2026_This is the title_tech,life,rant.md"
            const [datePart = "", titlePart = "", tagPart = ""] = rawInput;

            if (rawInput.length >= 3) {
                const rawTags = tagPart.split(",")

                this.title = titlePart;
                this.date = new Date(datePart)
                this.tags = rawTags;
            }
        }
    }
}