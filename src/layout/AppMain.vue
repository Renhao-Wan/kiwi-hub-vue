<template>
  <main class="app-main">
    <div class="app-main-container">
      <slot />
    </div>
  </main>
</template>

<script setup>
// 主体内容区，居中布局，最大宽度 1200px
</script>

<style scoped>
.app-main {
  flex: 1;
  width: 100%;
  padding: 20px 0;
}

.app-main-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .app-main {
    padding: 10px 0;
  }
  
  .app-main-container {
    padding: 0 15px;
  }
}
</style>
