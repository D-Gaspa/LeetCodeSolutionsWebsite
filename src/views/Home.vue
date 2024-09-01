<template>
  <div class="home">
    <h1 class="main-title">Welcome to LeetCode Solutions</h1>
    <p class="text-lg">This is the home page of our LeetCode solutions website.</p>
    <button class="btn-special" @click="$router.push('/problems')">View Problems</button>
  </div>
</template>

<script lang="ts" setup>
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5px 20px 20px 20px;
}
</style>