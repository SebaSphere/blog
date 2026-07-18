<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import { fetchRecentTracks } from "@/assets/ts/recentTracks";

const TRACK_COUNT = 3;
const REFRESH_MS = 30_000;

interface Track {
  name: string;
  artist: string;
  url: string;
  image: string;
  nowPlaying: boolean;
}

const PLACEHOLDER_HASH = "2a96cbd8b46e442fc41c2b86b821562f";
const isReal = (url?: string): url is string =>
  !!url && !url.includes(PLACEHOLDER_HASH);

const pickImage = (
  images: Array<{ size?: string; "#text"?: string }> = [],
): string => {
  for (const size of ["large", "extralarge", "medium", "small"]) {
    const hit = images.find((i) => i.size === size)?.["#text"];
    if (isReal(hit)) return hit;
  }
  return images.find((i) => isReal(i["#text"]))?.["#text"] ?? "";
};

const tracks = ref<Track[]>([]);
const loading = ref(true);
const error = ref(false);

let timer: number | null = null;

const load = async () => {
  try {
    const data = await fetchRecentTracks();
    const raw = data.recenttracks?.track ?? [];
    const seen = new Set<string>();
    const distinct: typeof raw = [];
    for (const t of raw) {
      const key = `${t.name}—${t.artist?.["#text"]}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      distinct.push(t);
      if (distinct.length >= TRACK_COUNT) break;
    }
    tracks.value = distinct.map((t) => ({
      name: t.name ?? "",
      artist: t.artist?.["#text"] ?? "",
      url: t.url ?? "",
      image: pickImage(t.image),
      nowPlaying: t["@attr"]?.nowplaying === "true",
    }));
    error.value = false;
  } catch {
    if (tracks.value.length === 0) error.value = true;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  load();
  timer = window.setInterval(load, REFRESH_MS);
});

onBeforeUnmount(() => {
  if (timer !== null) window.clearInterval(timer);
});
</script>

<template>
  <section class="recent">
    <h3 class="recent__title">Recently played</h3>

    <p v-if="loading && tracks.length === 0" class="recent__status">
      Cueing up...
    </p>
    <p v-else-if="error" class="recent__status">Couldn't load tracks.</p>

    <ul v-else class="recent__list">
      <li v-for="(track, i) in tracks" :key="i" class="track">
        <a
          class="track__link"
          :href="track.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span class="track__art">
            <img
              v-if="track.image"
              class="track__img"
              :src="track.image"
              alt=""
              loading="lazy"
            />
            <span v-else class="track__img track__img--fallback" aria-hidden="true"
              >&#9835;</span
            >
          </span>
          <span class="track__meta">
            <span class="track__name">{{ track.name }}</span>
            <span class="track__artist">{{ track.artist }}</span>
            <span v-if="track.nowPlaying" class="track__nowplaying">
              <img src="/images/shark.gif" alt="Shark gif" class="shark-gif"
                   aria-hidden="true" style="width: 32px">
              Now playing
            </span>
          </span>
        </a>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.recent {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: #2b1f3a;
}

.recent__title {
  margin: 0 0 0.75rem;
  font-size: 1.05rem;
  text-decoration: underline;
}

.recent__status {
  font-style: italic;
  opacity: 0.8;
}

.recent__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.track__link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s ease;
}

.track__link:hover {
  transform: translateX(2px);
}

.track__art {
  flex: none;
}

.track__img {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  object-fit: cover;
  display: block;
}

.track__img--fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  color: #fff;
  background: #7c3aed;
}

.track__meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.track__name {
  font-weight: 600;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track__artist {
  font-size: 0.8rem;
  opacity: 0.75;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track__nowplaying {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.15rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: #6d28d9;
}

.eq {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  height: 0.8em;
}

.eq i {
  width: 3px;
  height: 100%;
  background: #6d28d9;
  border-radius: 1px;
  transform-origin: bottom;
  animation: eq 0.9s ease-in-out infinite;
}

.eq i:nth-child(2) {
  animation-delay: 0.3s;
}

.eq i:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes eq {
  0%,
  100% {
    transform: scaleY(0.35);
  }
  50% {
    transform: scaleY(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .eq i {
    animation: none;
    transform: scaleY(0.7);
  }
}
</style>
