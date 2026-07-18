<script setup lang="ts">
import { boxActive } from "@/assets/ts/revealState";

withDefaults(defineProps<{ keep?: boolean }>(), { keep: false });
</script>

<template>
  <div v-show="keep || !boxActive" class="reveal-scope">
    <slot></slot>
  </div>
</template>

<style scoped>
.reveal-scope {
  display: contents;
}
</style>
