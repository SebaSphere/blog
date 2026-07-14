import {createRouter, createWebHashHistory, createWebHistory} from 'vue-router';
import BlogHomeView from '@/views/BlogHomeView.vue';
import BlogContent from '@/components/BlogContent.vue';
import MainPageView from "@/views/MainPageView.vue";

const routes = [
  {
    path: '/',
    name: 'home',
    component: MainPageView
  },
  {
    path: '/blog/',
    name: 'blog',
    component: BlogHomeView
  },
  {
    path: '/content/:id',
    name: 'content',
    component: BlogContent
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
