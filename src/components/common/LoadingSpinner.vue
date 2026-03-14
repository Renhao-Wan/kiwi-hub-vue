<template>
  <!-- 加载中状态 -->
  <div v-if="loading" class="loading-container" :class="{ 'loading-fullpage': fullpage }">
    <el-icon class="loading-icon" :size="size"><Loading /></el-icon>
    <p v-if="text" class="loading-text">{{ text }}</p>
  </div>

  <!-- 空状态 -->
  <div v-else-if="empty" class="empty-container">
    <el-empty :description="emptyText" :image-size="imageSize">
      <slot name="empty-action" />
    </el-empty>
  </div>

  <!-- 正常内容 -->
  <slot v-else />
</template>

<script setup>
import { Loading } from '@element-plus/icons-vue'

defineProps({
  /** 是否处于加载状态 */
  loading: {
    type: Boolean,
    default: false
  },
  /** 是否为空数据状态 */
  empty: {
    type: Boolean,
    default: false
  },
  /** 加载提示文字 */
  text: {
    type: String,
    default: '加载中...'
  },
  /** 空状态提示文字 */
  emptyText: {
    type: String,
    default: '暂无数据'
  },
  /** 图标大小 */
  size: {
    type: Number,
    default: 32
  },
  /** 空状态图片大小 */
  imageSize: {
    type: Number,
    default: 100
  },
  /** 是否全页面居中 */
  fullpage: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: var(--info-color);
}

.loading-container.loading-fullpage {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  z-index: 9999;
}

.loading-icon {
  animation: spin 1s linear infinite;
  color: var(--primary-color);
}

.loading-text {
  margin-top: 12px;
  font-size: var(--font-size-sm, 13px);
  color: var(--text-secondary);
}

.empty-container {
  padding: 40px 0;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
