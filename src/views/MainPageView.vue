<script setup lang="ts">

import FriendButtons from "@/components/FriendButtons.vue";
import HomeBanner from "@/components/HomeBanner.vue";
import CatPlaygarden from "@/components/CatPlaygarden.vue";
</script>

<template>
  <main>
    <home-banner></home-banner>
    <figure class="construction-notice">
      <img src="/images/construction.gif" alt="Under construction" />
      <figcaption>
        This site is currently in construction.
        <br>
        Please visit <a href="https://sebastianb.dev" style="color: blue;">sebastianb.dev</a> for more info.
      </figcaption>
    </figure>
    <p>TODO FOR ME TO ADD!!!</p>
    <friend-buttons></friend-buttons>
    <p>what im listening to</p>
    <p>about me</p>
    <p>project board</p>
    <p>blog: find this <a href="/blog" style="color: blue">here</a>.</p>
    <cat-playgarden></cat-playgarden>
  </main>
</template>

<style scoped>
:global(body) {
  background-color: #9B7EBD;
}

.construction-notice {
  flex-direction: column;
  margin: 0 auto 1.5rem;
}

.construction-notice img {
  width: 110px;
  height: auto;
}

.construction-notice figcaption {
  margin-top: 0.5rem;
}
</style>