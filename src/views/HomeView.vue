<script setup lang="ts">
  import {BlogFileList} from "@/assets/ts/BlogObject";
  import BlogTitle from "@/components/BlogTitle.vue";
  import { useRouter } from 'vue-router';

  const blogFileList = new BlogFileList();
  const router = useRouter();

  function goToBlog(index: number) {
    router.push(`/content/${index + 1}`);
  }
</script>

<template>
  <main>
    <p>This is a small blog I've made just to document cool things I've found or doing, general life events, and anything else I have in mind.</p>
    <br>
    <p>Aiming for monthly updates, always welcome to provide your thoughts at me@sebastianb.dev or my discord username "SebaSphere"</p>
    <br>
    <h1>My most recent posts</h1>
    <div v-for="(blog, index) in blogFileList.blogDetails" :key="blog.path" @click="goToBlog(index)">
      <blog-title :blog-information="blog"></blog-title>
    </div>
  </main>
</template>

<style scoped>
/* Any home-specific styles can go here */
</style>
