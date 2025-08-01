<template>
  <div id="app">
    <router-view>
    </router-view>
    <FloatingHomeButton v-if="$route.path !== '/'" />
  </div>
</template>

<script>
export default {
  name: 'App',
}
</script>

<script setup>
import FloatingHomeButton from './components/FloatingHomeButton.vue';
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  min-height: 100dvh;
}

body {
  margin: 0;
  padding: 0;
}
</style>
