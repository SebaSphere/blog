<script setup lang="ts">
  import { RouterView, useRoute } from 'vue-router';
  import { watch } from 'vue';

  const route = useRoute();

  watch(
    () => route.path,
    (path) => {
      const isBlog = path.startsWith('/blog') || path.startsWith('/content');
      document.body.classList.toggle('blog-page', isBlog);
    },
    { immediate: true }
  );
</script>

<template>
  <RouterView />
</template>

<style>

</style>
