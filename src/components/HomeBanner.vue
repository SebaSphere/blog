<script setup lang="ts">
// https://colorhunt.co/palette/462c7d831c91d552a3ff70bf
</script>

<template>
  <div class="banner">
    <img src="/images/Sphere_rotating_transparency.gif" alt="Sphere rotating"/>
    <h2>The SPHERE dev</h2>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Monoton&display=swap');

.banner {
  background: #7F55B1;
  height: 20vh;
  min-height: 120px;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 0 5%;
  box-sizing: border-box;
}

.banner img {
  height: 80%;
  width: auto;
  flex-shrink: 0;
}

.banner h2 {
  margin: 0;
  font-family: "Monoton", sans-serif;
  font-weight: 800;
  font-size: clamp(1.5rem, 5vw, 3.5rem);
  letter-spacing: 0.05em;
  color: #fff;
  white-space: nowrap;
  line-height: 1;
}

@media (max-width: 600px) {
  .banner {
    gap: 0.75rem;
    padding: 0 4%;
  }

  .banner img {
    height: 55%;
  }

  .banner h2 {
    font-size: clamp(1.1rem, 6vw, 2rem);
    letter-spacing: 0.03em;
  }
}
</style>
