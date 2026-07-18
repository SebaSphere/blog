import './assets/main.css'

import { createApp } from 'vue'
// @ts-ignore
import App from './App.vue'
import router from './router'
import { prefetchTopArtists } from './assets/ts/topArtists'

// Warm the top-artists data the moment the site loads so the word map has it
// ready by the time it mounts, instead of starting from a cold fetch.
prefetchTopArtists()

createApp(App).use(router).mount('#app')
