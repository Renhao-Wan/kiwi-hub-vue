<template>
  <div class="app-layout">
    <AppHeader />
    <AppMain>
      <router-view />
    </AppMain>
  </div>
</template>

<script setup>
import AppHeader from './AppHeader.vue'
import AppMain from './AppMain.vue'
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}
</style>
