/// <reference types="vite/client" />

declare module '*.md' {
  import type { Component } from 'vue'
  const component: Component
  export default component
}

// vuewordcloud ships no type declarations of its own.
declare module 'vuewordcloud' {
  import type { Component } from 'vue'
  const VueWordCloud: Component
  export default VueWordCloud
}
