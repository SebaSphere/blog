import type { Component } from 'vue'

export class BlogFileList {
    blogDetails: BlogInformation[] = [];

    constructor() {
        const files = import.meta.glob('@/assets/blog/*', { eager: true, import: 'default' }) as Record<string, Component>;
        const entries = Object.entries(files).sort((a, b) => a[0].localeCompare(b[0]));
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (entry) {
                const [path, component] = entry;
                const blog = new BlogInformation(path, component);
                blog.id = (i + 1).toString();
                this.blogDetails.push(blog);
            }
        }
    }
}

export class BlogInformation {
    path: string
    id: string = "";
    title: string = "";
    date: Date = new Date()
    tags: Array<string> = new Array<string>()
    component: Component | null = null

    constructor(path: string, component: Component) {
        this.path = path
        this.component = component

        // Extract filename from path
        const filename = path.split('/').pop() || "";
        
        if (filename.endsWith(".md")) {
            const nameWithoutExtension = filename.substring(0, filename.length - 3)
            const rawInput = nameWithoutExtension.split('_');

            // Example: "02-28-2026_Homelab thoughts, my woke takes, and robotic shenanigans_tech,life,rant.md"
            const [datePart = "", titlePart = "", tagPart = ""] = rawInput;

            if (rawInput.length >= 3) {
                const rawTags = tagPart.split(",")

                this.title = titlePart.replace(/\(U\+([0-9A-Fa-f]{4,6})\)/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
                this.date = new Date(datePart)
                this.tags = rawTags;
            }
        }
    }
}