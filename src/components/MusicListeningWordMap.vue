<script setup lang="ts">
import { onMounted, ref } from "vue";
import VueWordCloud from "vuewordcloud";
import { fetchTopArtists } from "@/assets/ts/topArtists";

interface Word {
  text: string;
  weight: number;
  image: string;
  rotation: number;
  url: string;
}

const words = ref<Word[]>([]);
const loading = ref(true);
const error = ref(false);

const PLACEHOLDER_HASH = "2a96cbd8b46e442fc41c2b86b821562f";
const isReal = (url?: string): url is string =>
  !!url && !url.includes(PLACEHOLDER_HASH);

const pickImage = (
  images: Array<{ size?: string; "#text"?: string }> = [],
): string => {
  for (const size of ["large", "medium", "extralarge", "small"]) {
    const hit = images.find((i) => i.size === size)?.["#text"];
    if (isReal(hit)) return hit;
  }
  return images.find((i) => isReal(i["#text"]))?.["#text"] ?? "";
};

const colorFor = (word: Word): string => {
  const max = words.value.reduce((m, w) => Math.max(m, w.weight), 1);
  const t = word.weight / max;
  if (t > 0.66) return "#6d28d9";
  if (t > 0.33) return "#7c3aed";
  return "#9b7ebd";
};

onMounted(async () => {
  try {
    const data = await fetchTopArtists();
    const artists = data.topartists?.artist ?? [];
    words.value = artists
      .map(
        ({ name, playcount, url, image }): Word => ({
          text: name ?? "",
          weight: Number(playcount),
          image: pickImage(image),
          rotation: Math.round((Math.random() - 0.5) * 180),
          url: url ?? "",
        }),
      )
      .filter(
        (w) => w.text !== "" && Number.isFinite(w.weight) && w.weight > 0,
      );
    if (words.value.length === 0) error.value = true;
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="word-map">
    <h2 class="word-map__title">
      Artists I've been popping off to in the last 30 days
    </h2>
    <div class="word-map__body">
      <p v-if="loading" class="word-map__status">Counting the plays...</p>
      <p v-else-if="error" class="word-map__status">
        Couldn't reach the turntable right now.
      </p>
      <vue-word-cloud
        v-else
        class="word-map__cloud"
      :words="words"
      :color="colorFor"
      font-family="Georgia, serif"
      :font-size-ratio="4"
      :spacing="0.3"
      rotation-unit="deg"
      :animation-duration="1200"
    >
      <template #default="{ text, word }">
        <a
          class="artist"
          :href="(word as Word).url"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            v-if="(word as Word).image"
            class="artist__img"
            :src="(word as Word).image"
            alt=""
            loading="lazy"
          />
          <span class="artist__name">{{ text }}</span>
        </a>
        </template>
      </vue-word-cloud>
    </div>
  </div>
</template>

<style scoped>
.word-map {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.word-map__title {
  margin: 0 0 12px;
  text-align: center;
  text-decoration: underline;
  color: #2b1f3a;
  font-size: 1.3rem;
}

.word-map__body {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.word-map__cloud {
  position: absolute;
  inset: 0;
}

.word-map__status {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2b1f3a;
  font-style: italic;
}

.artist {
  display: inline-flex;
  align-items: center;
  gap: 0.25em;
  cursor: pointer;
  color: inherit;
  text-decoration: none;
  transition: transform 0.15s ease;
}

.artist:hover {
  transform: scale(1.15);
}

.artist__img {
  width: 1em;
  height: 1em;
  border-radius: 50%;
  object-fit: cover;
  flex: none;
}
</style>
