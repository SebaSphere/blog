<script setup lang="ts">
// Information reveals two blurbs flanking the cat's bed — one word-wrapped
// column to the left, one to the right. Each column's inner edge curves along
// a circle twice the bed's size, so the text wraps around the bed. It stays
// hidden until the visitor has clicked the cat at least once AND the cat is
// parked back within 30% of the bed's width and height — i.e. settled at home.
// It owns no cat state: it polls the live CatEngine and reads the bed's
// on-screen rect straight from the DOM.
import { onMounted, onBeforeUnmount, ref, computed } from "vue";
import { CatEngine, CatStates } from "@/assets/ts/CatEngine";

// Bed geometry, in viewport pixels, kept in sync with the DOM.
const bedCx = ref(0);
const bedCy = ref(0);
// Half-width of the round bed.
const bedRadius = ref(60);

// The text wraps around a circle twice the size of the bed.
const wrapRadius = computed(() => bedRadius.value * 1.2);
// Column width so the two columns together span ~50% of the viewport, with a
// floor that always leaves room for words to flow around the wrap circle.
const colWidth = computed(() =>
  Math.max(wrapRadius.value + 120, viewportW.value * 0.25),
);
// Spacing kept between the text and the wrap circle.
const gap = 8;
// Horizontal breathing room between the two side columns on desktop, split
// evenly so each column pulls away from the bed centre by half this amount.
const columnGap = 64;
// Nudge both columns up a touch so the text sits higher over the bed.
const verticalOffset = 24;

const visible = ref(false);

// Below this viewport width we abandon the wrap-around layout and stack the
// columns vertically instead (left above the bed; right then bottom below it).
// The type is shrunk on mobile (see .info-stacked) so all three blocks fit
// around the viewport-centred bed without hitting the header or the fold.
const MOBILE_MAX_WIDTH = 640;
const isMobile = ref(false);
const viewportW = ref(0);
let mobileQuery: MediaQueryList | null = null;

// The rendered columns, so we can measure the actual text area on screen.
const leftColEl = ref<HTMLElement | null>(null);
const rightColEl = ref<HTMLElement | null>(null);
const bottomColEl = ref<HTMLElement | null>(null);

// Live heights of the side columns. Fixed-positioned elements can't auto-flow
// around each other, so we measure them and place the bottom column below
// whichever side column is taller — guaranteeing they never overlap.
const leftColH = ref(0);
const rightColH = ref(0);

// On mobile each column spans nearly the full viewport width (leaving a small
// margin each side), so the text reads across the screen rather than in a
// narrow centred strip.
const mobileColW = computed(() =>
  Math.max(0, viewportW.value - 32),
);

// Left column: flanks the bed on desktop, sits above it on mobile.
const leftStyle = computed(() =>
  isMobile.value
    ? {
        left: `${bedCx.value}px`,
        top: `${bedCy.value - wrapRadius.value - gap}px`,
        width: `${mobileColW.value}px`,
        transform: "translate(-50%, -100%)",
      }
    : {
        left: `${bedCx.value - colWidth.value - columnGap / 2}px`,
        top: `${bedCy.value - wrapRadius.value - verticalOffset}px`,
        width: `${colWidth.value}px`,
      },
);

// Right column: mirror of left on desktop, first block below the bed on mobile.
const rightStyle = computed(() =>
  isMobile.value
    ? {
        left: `${bedCx.value}px`,
        top: `${bedCy.value + wrapRadius.value + gap}px`,
        width: `${mobileColW.value}px`,
        transform: "translateX(-50%)",
      }
    : {
        left: `${bedCx.value + columnGap / 2}px`,
        top: `${bedCy.value - wrapRadius.value - verticalOffset}px`,
        width: `${colWidth.value}px`,
      },
);

// Bottom column: under the bed on desktop; stacked under the right block on
// mobile, offset by the right block's measured height.
const bottomStyle = computed(() => {
  if (isMobile.value) {
    return {
      left: `${bedCx.value}px`,
      top: `${bedCy.value + wrapRadius.value + gap + rightColH.value + gap}px`,
      width: `${mobileColW.value}px`,
    };
  }
  // Sit below whichever side column runs longest (and never above the wrap
  // circle), so a long blurb can't overlap the bottom row.
  const sideTop = bedCy.value - wrapRadius.value - verticalOffset;
  const sideBottom = sideTop + Math.max(leftColH.value, rightColH.value);
  const circleBottom = bedCy.value + wrapRadius.value;
  return {
    left: `${bedCx.value}px`,
    top: `${Math.max(sideBottom, circleBottom) + gap}px`,
    width: `${2 * colWidth.value}px`,
  };
});

// Sticky: once the visitor clicks the cat (sending it off the bed) the info
// becomes eligible to show whenever the cat returns home.
let hasBeenClicked = false;
let rafId: number | null = null;

// True when the cat's centre sits over either rendered text column.
const catInTextArea = (px: number, py: number): boolean => {
  for (const el of [leftColEl.value, rightColEl.value, bottomColEl.value]) {
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue; // hidden (display:none)
    if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) {
      return true;
    }
  }
  return false;
};

const tick = () => {
  const bed = document.querySelector<HTMLElement>(".cat-bed");
  const pos = CatEngine.getPosition();
  const state = CatEngine.getState();

  if (bed && pos && state !== null) {
    const rect = bed.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    bedCx.value = cx;
    bedCy.value = cy;
    bedRadius.value = Math.max(rect.width, rect.height) / 2;

    // Keep the side columns' heights current so the bottom column can be
    // positioned clear of whichever one is taller.
    if (leftColEl.value) {
      leftColH.value = leftColEl.value.getBoundingClientRect().height;
    }
    if (rightColEl.value) {
      rightColH.value = rightColEl.value.getBoundingClientRect().height;
    }

    // The cat leaving the bed means it was clicked; remember that for good.
    if (state !== CatStates.CAT_AT_HOME) {
      hasBeenClicked = true;
    }

    // Within 30% of the bed's width and height of its centre.
    const nearBed =
      Math.abs(pos.x - cx) <= rect.width * 0.3 &&
      Math.abs(pos.y - cy) <= rect.height * 0.3;

    if (!hasBeenClicked) {
      visible.value = false;
    } else if (nearBed) {
      // Settling back at the bed brings the text (back) up.
      visible.value = true;
    } else {
      // Otherwise it lingers as long as the cat stays over the text, and only
      // disappears once the cat wanders out of the text area entirely.
      visible.value = visible.value && catInTextArea(pos.x, pos.y);
    }
  } else {
    visible.value = false;
  }

  rafId = window.requestAnimationFrame(tick);
};

const syncViewport = () => {
  viewportW.value = window.innerWidth;
  isMobile.value = mobileQuery ? mobileQuery.matches : false;
};

onMounted(() => {
  mobileQuery = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
  mobileQuery.addEventListener("change", syncViewport);
  window.addEventListener("resize", syncViewport);
  syncViewport();
  rafId = window.requestAnimationFrame(tick);
});

onBeforeUnmount(() => {
  if (rafId !== null) {
    window.cancelAnimationFrame(rafId);
    rafId = null;
  }
  mobileQuery?.removeEventListener("change", syncViewport);
  window.removeEventListener("resize", syncViewport);
});
</script>

<template>
  <!-- Left column: right edge at the bed centre; its text hugs the left arc of
       the wrap circle. Top is anchored to the top of that circle. -->
  <aside
    ref="leftColEl"
    v-show="visible"
    class="info-col info-left"
    :class="{ 'info-stacked': isMobile }"
    :style="leftStyle"
  >
    <div
      v-show="!isMobile"
      class="hole"
      :style="{
        width: `${wrapRadius}px`,
        height: `${2 * wrapRadius}px`,
        shapeOutside: `circle(${wrapRadius}px at 100% 50%)`,
        shapeMargin: `${gap}px`,
        float: 'right',
        pointerEvents: 'none',
      }"
      aria-hidden="true"
    ></div>
    <slot name="left"></slot>
  </aside>
  <!-- Right column: left edge at the bed centre; mirror of the left. -->
  <aside
    ref="rightColEl"
    v-show="visible"
    class="info-col info-right"
    :class="{ 'info-stacked': isMobile }"
    :style="rightStyle"
  >
    <div
      v-show="!isMobile"
      class="hole"
      :style="{
        width: `${wrapRadius}px`,
        height: `${2 * wrapRadius}px`,
        shapeOutside: `circle(${wrapRadius}px at 0% 50%)`,
        shapeMargin: `${gap}px`,
        float: 'left',
        pointerEvents: 'none',
      }"
      aria-hidden="true"
    ></div>
    <slot name="right"></slot>
  </aside>
  <!-- Bottom row: centred under the bed, clear of the wrap circle. -->
  <aside
    ref="bottomColEl"
    v-show="visible"
    class="info-col info-bottom"
    :class="{ 'info-stacked': isMobile }"
    :style="bottomStyle"
  >
    <slot name="bottom"></slot>
  </aside>
</template>

<style scoped>
.info-col {
  position: fixed;
  /* Sits behind the bed and cat (they have a higher z-index, so they still
     receive their own clicks); the text itself stays selectable. */
  z-index: 2147483640;
  pointer-events: auto;
  color: #2b1f3a;
  font-size: 0.95rem;
  line-height: 1.5;
}

/* Each column reads toward the bed. */
.info-left {
  text-align: right;
}

.info-right {
  text-align: left;
}

/* Centred beneath the bed; nudged left by half its width to sit on centre. */
.info-bottom {
  text-align: center;
  transform: translateX(-50%);
}

/* Mobile: columns stack vertically and read centred rather than toward the
   bed. Positioning (and the centring transform) is driven by inline styles.
   Type and spacing shrink so all three blocks fit around the viewport-centred
   bed — above the bed clear of the header, below it clear of the fold. */
.info-stacked {
  text-align: center;
  font-size: 0.72rem;
  line-height: 1.3;
}

.info-stacked :slotted(h2) {
  margin: 0 0 0.25em;
  font-size: 0.9rem;
}

.info-stacked :slotted(p) {
  margin: 0 0 0.4em;
}

/* Tidy default spacing for whatever markup each column is fed. */
.info-col :slotted(h2) {
  margin: 0 0 0.4em;
  font-size: 1.15rem;
}

.info-col :slotted(p) {
  margin: 0 0 0.6em;
}

.info-col :slotted(:last-child) {
  margin-bottom: 0;
}
</style>
