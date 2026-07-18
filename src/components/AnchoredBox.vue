<script setup lang="ts">
import {
  onMounted,
  onBeforeUnmount,
  ref,
  computed,
  watch,
  type Component,
} from "vue";
import { CatEngine, CatStates } from "@/assets/ts/CatEngine";
import { boxActive } from "@/assets/ts/revealState";

const props = withDefaults(
  defineProps<{
    anchorEl: HTMLElement | null;
    contents?: Component[];
    regionTopEl?: HTMLElement | null;
    fill?: number;
  }>(),
  {
    contents: () => [],
    regionTopEl: null,
    fill: 0.8,
  },
);

const vw = ref(0);
const vh = ref(0);
const regionTop = ref(0);
const anchorH = ref(0);

const visible = ref(false);

const box = computed(() => {
  const regionH = Math.max(0, vh.value - regionTop.value);
  const w = vw.value * props.fill;
  const h = regionH * props.fill;
  return {
    x: (vw.value - w) / 2,
    y: regionTop.value + (regionH - h) / 2,
    w,
    h,
  };
});

const anchorGap = 12;

const inBox = (px: number, py: number): boolean => {
  const b = box.value;
  return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;
};

const OPEN_GRACE_MS = 450;
// Auto-close timeout (ms). The countdown resets whenever the cat is inside the box.
const ENTRY_REQUIRE_MS = 5000;
let entryTimerActive = false;
// Tracks when the auto-close countdown last reset (initially when the box opens).
let entryStartedAt = 0;

let rafId: number | null = null;
let liftedEl: HTMLElement | null = null;
let openedAt = 0;
let openAnchorRect: { x: number; y: number; w: number; h: number } | null = null;

const inRect = (
  px: number,
  py: number,
  r: { x: number; y: number; w: number; h: number },
): boolean => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;

const liftAnchor = (el: HTMLElement) => {
  el.style.position = "fixed";
  el.style.left = `${vw.value / 2}px`;
  el.style.top = `${box.value.y - anchorGap - anchorH.value}px`;
  el.style.transform = "translateX(-50%)";
  el.style.margin = "0";
  el.style.zIndex = "2147483631";
  liftedEl = el;
};

const dropAnchor = (el: HTMLElement) => {
  el.style.position = "";
  el.style.left = "";
  el.style.top = "";
  el.style.transform = "";
  el.style.margin = "";
  el.style.zIndex = "";
  liftedEl = null;
};

const tick = () => {
  vw.value = window.innerWidth;
  vh.value = window.innerHeight;
  regionTop.value = props.regionTopEl
    ? props.regionTopEl.getBoundingClientRect().bottom
    : 0;

  const el = props.anchorEl;
  if (el) {
    anchorH.value = el.getBoundingClientRect().height;
  }

  const pos = CatEngine.getPosition();
  const state = CatEngine.getState();
  if (el && pos && state !== null) {
    if (!visible.value) {
      if (CatEngine.isOver(el)) {
        visible.value = true;
        openedAt = performance.now();
        entryTimerActive = true;
        entryStartedAt = openedAt;
        const r = el.getBoundingClientRect();
        openAnchorRect = { x: r.left, y: r.top, w: r.width, h: r.height };
      }
    } else {
      const now = performance.now();
      const inTheBox = inBox(pos.x, pos.y);
      const stay =
        inTheBox ||
        CatEngine.isOver(el) ||
        (openAnchorRect !== null && inRect(pos.x, pos.y, openAnchorRect));
      const inGrace = now - openedAt < OPEN_GRACE_MS;

      if (entryTimerActive) {
        // While the box is open, keep a rolling 5s timeout that resets when
        // the cat is inside the box. Close if the cat stays out for >= timeout.
        if (inTheBox) {
          // Reset the inactivity timer while in the box.
          entryStartedAt = now;
        } else if (now - entryStartedAt >= ENTRY_REQUIRE_MS) {
          // Auto-close after being outside the box for too long.
          visible.value = false;
          entryTimerActive = false;
        }
        // Regardless of timer, if the cat goes home, close immediately.
        if (state === CatStates.CAT_AT_HOME) {
          visible.value = false;
          entryTimerActive = false;
        }
      } else {
        // Fallback close rules if the timer was disabled unexpectedly.
        if (state === CatStates.CAT_AT_HOME || (!stay && !inGrace)) {
          visible.value = false;
        }
      }
    }
  } else {
    visible.value = false;
    entryTimerActive = false;
  }

  if (visible.value && el) {
    liftAnchor(el);
  } else if (liftedEl) {
    dropAnchor(liftedEl);
  }

  rafId = window.requestAnimationFrame(tick);
};

watch(visible, (open) => {
  boxActive.value = open;
});

onMounted(() => {
  rafId = window.requestAnimationFrame(tick);
});

onBeforeUnmount(() => {
  if (rafId !== null) {
    window.cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (liftedEl) dropAnchor(liftedEl);
  boxActive.value = false;
});
</script>

<template>
  <div
    class="anchored-box"
    :class="{ 'anchored-box--open': visible }"
    :aria-hidden="!visible"
  >
    <svg
      class="anchored-box__svg"
      :viewBox="`0 0 ${vw} ${vh}`"
      :width="vw"
      :height="vh"
      preserveAspectRatio="none"
    >
      <rect
        class="anchored-box__panel"
        :x="box.x"
        :y="box.y"
        :width="box.w"
        :height="box.h"
        rx="16"
      />
    </svg>

    <div
      class="anchored-box__content"
      :style="{
        left: `${box.x}px`,
        top: `${box.y}px`,
        width: `${box.w}px`,
        height: `${box.h}px`,
      }"
    >
      <component :is="c" v-for="(c, i) in contents" :key="i" />
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.anchored-box {
  position: fixed;
  inset: 0;
  z-index: 2147483630;
  pointer-events: none;
  visibility: hidden;
  opacity: 0;
}

.anchored-box--open {
  visibility: visible;
  opacity: 1;
}

.anchored-box__svg {
  position: absolute;
  inset: 0;
}

.anchored-box__panel {
  fill: rgba(255, 255, 255, 0.55);
  stroke: #6ea8ff;
  stroke-width: 3;
}

.anchored-box__content {
  position: absolute;
  box-sizing: border-box;
  padding: 24px;
  overflow: auto;
  pointer-events: auto;
  color: #2b1f3a;
}
</style>
