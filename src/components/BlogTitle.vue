<script lang="ts">

import { ref } from 'vue'
import {BlogInformation} from "@/assets/ts/BlogObject.ts";

export default {
  props: {
    blogInformation: BlogInformation,
  }
}

</script>

<template>
  <div class="blog-box p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all cursor-pointer" hr>
    <div class="flex justify-between items-start mb-4">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
        {{ blogInformation?.title }}
      </h2>
      <span class="text-sm text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap ml-4">
        {{ blogInformation?.date?.toLocaleDateString() }}
      </span>
    </div>
    
    <div class="flex flex-wrap gap-2">
      <span 
        v-for="tag in blogInformation?.tags" 
        :key="tag"
        class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs font-semibold rounded-full"
      >
        {{ tag }}
      </span>
    </div>
  </div>


</template>

<style scoped>
</style>