<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import { CatEngine, CatStates } from "@/assets/ts/CatEngine";

const hintFile = "/images/click.gif";

const catX = ref<number | null>(null);
const catY = ref<number | null>(null);
const visible = ref(false);

let rafId: number | null = null;

const tick = () => {
  const pos = CatEngine.getPosition();
  const state = CatEngine.getState();

  if (pos) {
    catX.value = pos.x;
    catY.value = pos.y;
  }
  visible.value = pos !== null && state === CatStates.CAT_AT_HOME;

  rafId = window.requestAnimationFrame(tick);
};

onMounted(() => {
  rafId = window.requestAnimationFrame(tick);
});

onBeforeUnmount(() => {
  if (rafId !== null) {
    window.cancelAnimationFrame(rafId);
    rafId = null;
  }
});
</script>

<template>
  <img
    v-show="visible && catX !== null"
    class="cat-click-hint"
    :src="hintFile"
    :style="{ left: `${catX}px`, top: `${(catY ?? 0) - 16}px` }"
    alt=""
    aria-hidden="true"
  />
</template>

<style scoped>
.cat-click-hint {
  position: fixed;
  width: 80px;
  height: auto;
  transform: translate(-50%, calc(-100% - 4px));
  pointer-events: none;
  image-rendering: pixelated;
  z-index: 2147483647;
}
</style>
