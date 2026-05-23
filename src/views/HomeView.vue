<script setup lang="ts">
  import {BlogFileList} from "@/assets/ts/BlogObject";
  import BlogTitle from "@/components/BlogTitle.vue";
  import RssButton from "@/components/RssButton.vue";
  import { useRouter } from 'vue-router';

  const blogFileList = new BlogFileList();
  const router = useRouter();
</script>

<template>
  <main>
    <p>This is a small blog I've made just to document cool things I've found or doing, general life events, and anything else I have in mind.</p>
    <br>
    <p>Aiming for monthly updates, always welcome to provide your thoughts at me@sebastianb.dev or my discord username "SebaSphere"</p>
    <br>
    <p>Opinions and takes are my own</p>
    <br>
    <h1>My most recent posts</h1>
    <div v-for="blog in blogFileList.blogDetails" :key="blog.path" @click="router.push(`/content/${blog.id}`)">
      <blog-title :blog-information="blog" class="blog-title"></blog-title>
    </div>
    <div class="rss-footer">
      <rss-button href="https://notification.lachupacabra.club/rss" />
    </div>
  </main>
</template>

<style scoped>
  .blog-title {
    margin-bottom: 1rem;
  }

  .rss-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 2rem;
  }
</style>
