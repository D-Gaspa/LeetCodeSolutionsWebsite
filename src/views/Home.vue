<template>
  <div>
    <h1>{{ home }}</h1>
    <p>This is a placeholder for the {{ home }} component.</p>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data() {
    return {
      home: 'Home'
    }
  }
}
</script>

<style scoped>
/* Add any component-specific styles here */
</style>