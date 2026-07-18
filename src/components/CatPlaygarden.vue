<script setup lang="ts">
// CatPlaygarden renders the cat's bed and hands its behaviour off to a
// CatEngine, which owns all of the oneko.js state/animation logic. This
// component only cares about the Vue side: the bed element and the
// mount/unmount lifecycle.
import { onMounted, onBeforeUnmount, ref } from "vue";
import { CatEngine } from "@/assets/ts/CatEngine";
import CatClickHint from "@/components/CatClickHint.vue";
import Information from "@/components/Information.vue";
import RevealScope from "@/components/RevealScope.vue";
import { boxActive } from "@/assets/ts/revealState";

const bedFile = "/images/grey-soft-round-plush-pet-bed-png.png";

// The bed element is the anchor for the cat's home coordinate. The cat lives
// in the viewport's fixed-position pixel space, so the engine reads the bed's
// rendered centre from the DOM rather than assuming a fixed pixel value.
const bedEl = ref<HTMLImageElement | null>(null);

const engine = new CatEngine({
  getBedElement: () => bedEl.value,
});

onMounted(() => {
  engine.start();
});

onBeforeUnmount(() => {
  engine.stop();
});
</script>

<template>
  <!-- The bed marks the middle coordinate where the cat rests. -->
  <!-- Re-anchor once the image loads: its height (and thus centre) isn't
       known until then, so the cat's resting Y would otherwise be stale. -->
  <!-- Hidden while a reveal box is open. We fade it with opacity rather than
       display:none so it stays measurable — the engine reads the bed's rect to
       find the cat's home, and a collapsed rect would send home to the corner. -->
  <img
    ref="bedEl"
    class="cat-bed"
    :class="{ 'cat-bed--hidden': boxActive }"
    :src="bedFile"
    alt=""
    aria-hidden="true"
    @load="engine.syncHomeToBed()"
  />
  <!-- The click hint and the info blurb are unmarked: they hide while a reveal
       box has taken over the page (only the cat/bed themselves stay). -->
  <reveal-scope>
  <!-- Floats the "click me" gif above the cat while it's on the move. -->
  <cat-click-hint></cat-click-hint>
  <!-- Blurb that wraps around the bed once the cat's been clicked and settled. -->
  <information>
    <template #left>
      <h2>Who is this nerd?</h2>
      <p>
        I'm a software engineer by trade. I've worked in a few industries such as gaming, real estate, and AI research.
        I currently go to Miami Dade College for a  <a href="https://www.mdc.edu/softwareengineering/" style="color: blue">Information Systems Technology</a> degree with an expected graduation of May 2026
      </p>
      <p>Starting with concrete problems and working up by reiterating complexity on top of systems is what I enjoy most about software.</p>
    </template>
    <template #right>
      <p>
        I have a very particular breathe of skills with interests in many buckets such as server administration through my
        own Minecraft servers on my own homelab, business management and client outreach through running my own Minecraft mod development firm and 3D printing and modelling my own functional parts.
        My mod development work has been featured by content creators reaching a combined audience in the millions (see my projects here)
      </p>
      <p>
        I love traveling, some of my favorite places I’ve been include Hokkaido, London, and New York.
        I also like to do CAD design on my freetime, most wackiest thing I’ve modeled is a potato holder for my old aquarium.
      </p>
    </template>
    <template #bottom>
      <p>
        Move the cat to specific subsections on this website to find out new
        information
      </p>
    </template>
  </information>
  </reveal-scope>
</template>

<style scoped>
.cat-bed {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: auto;
  pointer-events: none;
  image-rendering: auto;
  /* just below the cat's z-index so the cat sits on top of the bed */
  z-index: 2147483646;
}

/* Invisible but still laid out (so its rect stays valid) while the box is open. */
.cat-bed--hidden {
  opacity: 0;
}
</style>
