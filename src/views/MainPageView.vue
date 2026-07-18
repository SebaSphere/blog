<script setup lang="ts">
import { ref } from "vue";
import FriendButtons from "@/components/FriendButtons.vue";
import HomeBanner from "@/components/HomeBanner.vue";
import CatPlaygarden from "@/components/CatPlaygarden.vue";
import ListeningMusic from "@/components/ListeningMusic.vue";
import AnchoredBox from "@/components/AnchoredBox.vue";
import RevealScope from "@/components/RevealScope.vue";
import MusicListeningWordMap from "@/components/MusicListeningWordMap.vue";
import RecentTracks from "@/components/RecentTracks.vue";

// The wrapper around ListeningMusic is the anchor the box binds to: the box
// opens when the cat lands on this element, and it's lifted above the box.
const musicEl = ref<HTMLElement | null>(null);
// The banner marks the top of the empty space the box sizes itself against.
const bannerEl = ref<HTMLElement | null>(null);
</script>

<template>
  <main>
    <!-- keep: banner stays visible in focus mode (the box's special mark). -->
    <reveal-scope keep>
      <div ref="bannerEl">
        <home-banner></home-banner>
      </div>
    </reveal-scope>
    <figure class="construction-notice">
      <img src="/images/construction.gif" alt="Under construction" />
      <figcaption>
        This site is currently in construction.
        <br>
        Please visit <a href="https://thesphere.dev" style="color: blue;">thesphere.dev</a> for my original site.
      </figcaption>
    </figure>
    <p>TODO FOR ME TO ADD!!!</p>
    <p>project board</p>
    <p>blog: find this <a href="/blog" style="color: blue">here</a>.</p>
    <friend-buttons></friend-buttons>
    <!-- keep: the activator stays visible; the box lifts it above itself. -->
    <reveal-scope keep>
      <div ref="musicEl" class="music-anchor">
        <listening-music></listening-music>
      </div>
    </reveal-scope>
    <!-- Opens when the cat lands on the music widget. In focus mode it hides
         every unmarked <reveal-scope>, lifts the music widget just above its top
         edge, and shows its contents. Sized to 80% of the space below the banner. -->
    <anchored-box :anchor-el="musicEl" :region-top-el="bannerEl">
      <div class="music-panel">
        <recent-tracks class="music-panel__tracks"></recent-tracks>
        <music-listening-word-map
          class="music-panel__cloud"
        ></music-listening-word-map>
      </div>
    </anchored-box>
    <!-- keep: the cat stays visible so it can still be sent home to close. -->
    <reveal-scope keep>
      <cat-playgarden></cat-playgarden>
    </reveal-scope>
  </main>
</template>

<style scoped>
:global(body) {
  background-color: #9B7EBD;
}

/* Shrink-wrap the widget so the box's clip hole (and the "cat is over music"
   test) tracks the music widget itself, not a full-width row — otherwise the
   full-width rect erases the whole top border instead of clipping around it.
   Safe now that the image has a fixed width, so this no longer shrinks it. */
.music-anchor {
  display: inline-block;
}

/* Inside the box: recent tracks on the left, the word map filling the rest. */
.music-panel {
  display: flex;
  gap: 24px;
  height: 100%;
}

.music-panel__tracks {
  flex: 0 0 240px;
  min-width: 0;
}

.music-panel__cloud {
  flex: 1 1 auto;
  min-width: 0;
}

/* Stack them on a narrow box so neither column gets crushed: the recently-played
   list on top, the word map directly below it. The cloud gets a concrete height
   (rather than flex-filling the tall fixed box) so it renders as a compact cloud
   right under the tracks instead of a near-empty sliver with a big gap above. */
@media (max-width: 640px) {
  .music-panel {
    flex-direction: column;
    gap: 16px;
    /* Let the stack grow past the box and the box scroll, rather than squeezing
       both into the fixed height. */
    height: auto;
    min-height: 100%;
  }

  .music-panel__tracks {
    flex: 0 0 auto;
  }

  .music-panel__cloud {
    flex: 0 0 auto;
    height: min(55vh, 360px);
  }
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