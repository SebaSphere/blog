<script setup lang="ts">
import { useRoute } from 'vue-router';
import { BlogFileList } from '@/assets/ts/BlogObject.ts';
import { computed } from 'vue';
import 'giscus';

const route = useRoute();
const blogFileList = new BlogFileList();

const blog = computed(() => {
  const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;
  return blogFileList.blogDetails.find(b => b.id === id);
});
</script>

<template>
  <div class="blog">
    <div v-if="blog" class="blog-content prose dark:prose-invert max-w-none">
      <router-link to="/blog" class="text-blue-500 hover:underline mb-4 inline-block">&larr; Back to home</router-link>
      <h1>{{ blog.title }}</h1>
      <div class="flex gap-4 text-sm text-gray-500 mb-6">
        <span>{{ blog.date.toLocaleDateString() }}</span>
        <div class="flex gap-2">
          <span v-for="tag in blog.tags" :key="tag" class="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
            {{ tag }}
          </span>
        </div>
      </div>
      <component v-if="blog.component" :is="blog.component" />
    </div>
    <div v-else>
      <p>Blog not found.</p>
      <router-link to="/blog">Back to home</router-link>
    </div>
    <div v-if="blog" class="mt-8">
      <giscus-widget
          id="comments"
          repo="SebaSphere/blog"
          repoid="R_kgDORbZ9cA"
          category="Blog Content"
          categoryid="DIC_kwDORbZ9cM4C51V6"
          mapping="pathname"
          strict="0"
          reactionsenabled="1"
          emitmetadata="0"
          inputposition="top"
          theme="preferred_color_scheme"
          lang="en"
          loading="lazy"
      ></giscus-widget>
    </div>
  </div>
</template>

<style scoped>
.blog-content {
  padding: 2rem 0;
}
.blog-content :deep(p) {
  margin-bottom: 20px;
}
</style>