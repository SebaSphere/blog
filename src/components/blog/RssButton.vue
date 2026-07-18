<script setup lang="ts">
  defineProps<{
    href: string;
  }>();
</script>

<template>
  <a
    class="rss-button"
    :href="href"
    target="_blank"
    rel="noopener"
    title="Subscribe via RSS"
    aria-label="Subscribe via RSS"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path fill="currentColor" d="M6.18 17.82a2.18 2.18 0 1 1-4.36 0 2.18 2.18 0 0 1 4.36 0zM2 9.86v3.16c4.97 0 9 4.03 9 9h3.16C14.16 16.27 8.73 9.86 2 9.86zm0-5.86v3.17c8.39 0 15.18 6.79 15.18 15.18H20C20 12.49 11.91 4 2 4z"/>
    </svg>
    <span>RSS</span>
  </a>
</template>

<style scoped>
  .rss-button {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.75rem;
    border: 1px solid currentColor;
    border-radius: 0.4rem;
    color: #f26522;
    text-decoration: none;
    font-size: 0.9rem;
    line-height: 1;
  }

  .rss-button:hover {
    background: #f26522;
    color: #fff;
  }
</style>
