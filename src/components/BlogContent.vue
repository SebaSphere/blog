<script setup lang="ts">
import { useRoute } from 'vue-router';
import { BlogFileList } from '@/assets/ts/BlogObject';
import { VueMarkdownIt } from '@f3ve/vue-markdown-it';
import { computed } from 'vue';

const route = useRoute();
const blogFileList = new BlogFileList();

const blogIndex = computed(() => {
  const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;
  return parseInt(id) - 1;
});

const blog = computed(() => {
  return blogFileList.blogDetails[blogIndex.value];
});
</script>

<template>
  <div v-if="blog" class="blog-content prose dark:prose-invert max-w-none">
    <router-link to="/" class="text-blue-500 hover:underline mb-4 inline-block">&larr; Back to home</router-link>
    <h1>{{ blog.title }}</h1>
    <div class="flex gap-4 text-sm text-gray-500 mb-6">
      <span>{{ blog.date.toLocaleDateString() }}</span>
      <div class="flex gap-2">
        <span v-for="tag in blog.tags" :key="tag" class="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
          {{ tag }}
        </span>
      </div>
    </div>
    <VueMarkdownIt :source="blog.contentRaw" />
  </div>
  <div v-else>
    <p>Blog not found.</p>
    <router-link to="/">Back to home</router-link>
  </div>
</template>

<style scoped>
.blog-content {
  padding: 2rem 0;
}
</style>